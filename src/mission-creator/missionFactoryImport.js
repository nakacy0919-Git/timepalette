// Browser-only ZIP reader and authenticated, sequential draft importer.
// Uses existing Mission Creator saveQuestion/uploadImage APIs. Never publishes.
import JSZip from 'jszip';
import { creatorRequest } from './api.js';
import { blobToBase64,optimizeImage } from './image.js';
import {FACTORY_MAX_IMAGE_BYTES,FACTORY_MAX_UNPACKED_BYTES,FACTORY_MAX_ZIP_BYTES,
  validateFactoryManifest} from './missionFactorySchema.js';

const MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'};

export async function readMissionFactoryZip(file,existingQuestions=[]) {
  if(!file||!(/\.zip$/i.test(file.name)||file.type==='application/zip'))throw new Error('ZIPファイルを選択してください。');
  if(!file.size||file.size>FACTORY_MAX_ZIP_BYTES)throw new Error('ZIPファイルは40MB以下にしてください。');
  const zip=await JSZip.loadAsync(file,{checkCRC32:false});
  const files=Object.values(zip.files).filter(e=>!e.dir);
  if(files.length>30)throw new Error('ZIP内のファイルが多すぎます（最大30）。');
  let total=0;
  for(const entry of files){
    const name=entry.name;
    if(name.includes('\\')||name.startsWith('/')||name.split('/').includes('..')||(entry.unsafeOriginalName && entry.unsafeOriginalName!==entry.name))
      throw new Error('ZIP内に不正なファイルパスがあります。');
    if(name!=='questions.json'&&!/^images\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}\.(?:png|jpe?g|webp)$/i.test(name))
      throw new Error('ZIPにはquestions.jsonとimages/以下の画像のみ格納できます。');
    const size=entry._data?.uncompressedSize;
    if(!Number.isSafeInteger(size)||size<0||size>(name==='questions.json'?200000:FACTORY_MAX_IMAGE_BYTES))
      throw new Error(`ファイルサイズが不正です：${name}`);
    total+=size;
    if(total>FACTORY_MAX_UNPACKED_BYTES)throw new Error('展開後のサイズ上限を超えました。');
  }
  const jsonEntry=zip.file('questions.json');
  if(!jsonEntry)throw new Error('ZIPの直下にquestions.jsonがありません。');
  let manifest;
  try{manifest=JSON.parse(await jsonEntry.async('string'));}
  catch{throw new Error('questions.jsonが正しいJSONではありません。');}
  const items=validateFactoryManifest(manifest,existingQuestions);
  for(const item of items){
    for(const image of item.images){
      const entry=zip.file(image.path);
      if(!entry)throw new Error(`${item.label}: ${image.path} がZIP内にありません。`);
      if((entry._data?.uncompressedSize||0)===0)throw new Error(`${item.label}: 空の画像です。`);
      image.entry=entry;
    }
  }
  return {items,zip};
}

export async function importFactoryDrafts(plan,{session,onProgress=()=>{}}) {
  if(!session)throw new Error('Mission Creatorへのログインが必要です。');
  const report=[];
  let ordinal=0;
  for(const item of plan.items){
    ordinal++;
    if(item.duplicate){report.push({number:ordinal,status:'skipped',reason:'既存の問題と重複',prompt:item.question.prompt});continue;}
    let id=null;
    const record={number:ordinal,status:'failed',id:null,prompt:item.question.prompt,reason:''};
    report.push(record);
    try{
      onProgress({current:ordinal,total:plan.items.length,step:'問題を下書き保存中',prompt:item.question.prompt});
      const saved=await creatorRequest('saveQuestion',{question:item.question},session);
      id=saved?.question?.id;
      if(!id)throw new Error('サーバーから問題IDが返されませんでした。');
      record.id=id;
      for(const image of item.images){
        onProgress({current:ordinal,total:plan.items.length,step:`画像${image.slot}をR2へ保存中`,prompt:item.question.prompt});
        const ext=image.path.split('.').pop().toLowerCase();
        const bytes=await image.entry.async('blob');
        const file=new File([bytes],image.path.split('/').pop(),{type:MIME[ext]});
        const optimized=await optimizeImage(file);
        try{
          await creatorRequest('uploadImage',{
            questionId:id,slot:image.slot,base64:await blobToBase64(optimized.blob)
          },session);
        }finally{
          URL.revokeObjectURL(optimized.previewUrl);
        }
      }
      record.status='saved';
      record.reason='下書き登録済み（未公開）';
    }catch(e){
      record.reason=(e?.message||'登録に失敗しました。') + (id?' / 下書きID: '+id:'');
      // No rollback/deletion: partially saved drafts must remain recoverable.
    }
  }
  return report;
}
