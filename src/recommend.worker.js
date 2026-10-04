import {pipeline,env} from '@huggingface/transformers';
import wasmURL from '../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url';
import runtimeURL from '../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs?url';
env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.wasmPaths={wasm:wasmURL,mjs:runtimeURL};
let model;
const vectors=new Map();
self.onmessage=async({data})=>{
 const {id,query,texts}=data;
 try{
  if(!model)model=await pipeline('feature-extraction','Xenova/paraphrase-multilingual-MiniLM-L12-v2',{dtype:'q8',device:'wasm',progress_callback:p=>{self.postMessage({id,type:'progress',text:p.status==='progress'?`AI 모델 다운로드 ${Math.round(p.progress||0)}%`:'AI 모델 준비 중'});}});
  self.postMessage({id,type:'progress',text:'취향에 맞는 식당을 비교하고 있어요'});
  const queryVector=(await model(query,{pooling:'mean',normalize:true})).tolist()[0];
  const scores=[];
  for(let i=0;i<texts.length;i++){
   if(!vectors.has(texts[i]))vectors.set(texts[i],(await model(texts[i],{pooling:'mean',normalize:true})).tolist()[0]);
   const v=vectors.get(texts[i]);scores.push(v.reduce((sum,x,j)=>sum+x*queryVector[j],0));
   self.postMessage({id,type:'progress',text:`식당 비교 중 ${i+1}/${texts.length}`});
  }
  if(vectors.size>300)vectors.clear();
  self.postMessage({id,type:'result',scores});
 }catch(e){console.error('DANGDO AI model error:',e);model=null;self.postMessage({id,type:'error',message:'AI 모델을 실행하지 못했어요. 네트워크와 기기 메모리를 확인하고 다시 시도해 주세요.'});}
};
