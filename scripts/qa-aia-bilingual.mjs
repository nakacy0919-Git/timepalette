import {readFile,writeFile} from 'node:fs/promises';
import {aiaQuestionIssues,buildAiaProductionPlan} from '../src/utils/worldGameAiaAuthoring.js';
const args=process.argv.slice(2);
if(args[0]==='--plan'){
 const seed=JSON.parse(await readFile(new URL('../docs/aia-refresh/verified-statistics-seed.json',import.meta.url),'utf8'));
 const plan=buildAiaProductionPlan(seed.scope);
 if(args[1])await writeFile(args[1],JSON.stringify(plan,null,2)+'\n');
 console.log(JSON.stringify({countries:plan.countries.length,targetQuestions:plan.targetQuestions,perCountry:plan.perCountry,languages:plan.languages}));
}else{
 if(!args[0])throw Error('Usage: node scripts/qa-aia-bilingual.mjs <question-json> [--publish] or --plan <output-json>');
 const data=JSON.parse(await readFile(args[0],'utf8')),records=Array.isArray(data)?data:data.questions;
 if(!Array.isArray(records))throw Error('Expected questions array');
 const seen=new Set(),errors=[],pending=[];
 for(const q of records){
  const issues=aiaQuestionIssues(q);
  if(seen.has(q?.id))issues.push('duplicate_id');seen.add(q?.id);
  if(issues.length)errors.push({id:q?.id,issues});
  const readiness=aiaQuestionIssues(q,{publish:true});
  if(readiness.length)pending.push({id:q?.id,issues:readiness});
 }
 const report={total:records.length,bilingualStructurePassed:records.length-errors.length,publicationReady:records.length-pending.length,errors,pending};
 console.log(JSON.stringify(report,null,2));
 if(errors.length||(args.includes('--publish')&&pending.length))process.exitCode=1;
}
