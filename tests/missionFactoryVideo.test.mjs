import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {FACTORY_VERSION,validateFactoryManifest} from '../src/mission-creator/missionFactorySchema.js';
import {readMissionFactoryZip} from '../src/mission-creator/missionFactoryImport.js';

const sample = () => ({version:FACTORY_VERSION,questions:[{
  countryIso:'et',domain:'lifeCulture',type:'video4',
  prompt:'動画を見て、水を得るために行う活動を選ぼう。',
  answer:'水をくみに行く',choices:['魚を捕る','登山する','畑を耕す'],
  notes:'UNICEF公式の動画。視聴して内容を確認する。',
  sources:['https://www.unicef.or.jp/kodomo/'],
  video:{youtubeUrl:'https://www.youtube.com/watch?v=PP0IvKmLfRY',startSeconds:0,endSeconds:0},
  learning:{levels:['elementary','juniorHigh','highSchoolStandard']}
}]});

test('video4 is validated and stays a non-published Mission Creator draft',()=>{
  const [item]=validateFactoryManifest(sample());
  assert.equal(item.question.type,'video4');
  assert.equal(item.question.video.youtubeId,'PP0IvKmLfRY');
  assert.equal(item.question.video.startSeconds,0);
  assert.deepEqual(item.images,[]);
  assert.equal(item.question.status,undefined);
  assert.equal(item.question.id,undefined);
});
test('video4 rejects arbitrary hosts, malformed IDs, and invalid time ranges',()=>{
  for(const url of ['https://fake-youtube.com/watch?v=PP0IvKmLfRY','javascript:alert(1)','https://www.youtube.com/watch?v=not-valid']){
    const a=sample(); a.questions[0].video.youtubeUrl=url;
    assert.throws(()=>validateFactoryManifest(a),/YouTube URL/);
  }
  for(const times of [{startSeconds:-1,endSeconds:0},{startSeconds:300,endSeconds:250},{startSeconds:0,endSeconds:2000}]){
    const a=sample();Object.assign(a.questions[0].video,times);
    assert.throws(()=>validateFactoryManifest(a),/開始・終了/);
  }
});
test('video4 cannot be given image slots, and non-video types cannot smuggle video',()=>{
  const a=sample();a.questions[0].images={'1':'images/a.png'};
  assert.throws(()=>validateFactoryManifest(a),/画像/);
  const b=sample();b.questions[0].type='text4';
  assert.throws(()=>validateFactoryManifest(b),/video設定/);
});
test('video4 JSON-only ZIP is parsed without image assets',async()=>{
  const zip=new JSZip();zip.file('questions.json',JSON.stringify(sample()));
  const data=await zip.generateAsync({type:'nodebuffer'});
  data.name='unicef-video.zip';data.size=data.byteLength;
  const result=await readMissionFactoryZip(data);
  assert.equal(result.items.length,1);
  assert.equal(result.items[0].question.video.youtubeId,'PP0IvKmLfRY');
});
