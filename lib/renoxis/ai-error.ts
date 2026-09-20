import Anthropic from '@anthropic-ai/sdk';
import {NextResponse} from 'next/server';
export function aiError(error:unknown){
 let message='Cixy could not finish this request. Please retry shortly.';
 if(error instanceof Anthropic.APIError){
  if(error.status===401||error.status===403)message='Cixy’s AI provider key needs attention. The site owner must verify the Anthropic key and permissions in Vercel.';
  else if(error.status===404)message='The configured AI model is unavailable. The site owner must update ANTHROPIC_MODEL in Vercel.';
  else if(/credit|billing|balance/i.test(error.message))message='The AI provider needs API credits or billing setup. Your saved workspace is still available.';
  else if(error.status===429)message='The AI provider is rate-limited. Please wait a moment and retry.';
  console.error('AI provider request failed',{status:error.status,requestId:error.requestID});
 }else{console.error('AI request failed',{name:error instanceof Error?error.name:'Unknown'});}
 return NextResponse.json({error:message},{status:503,headers:{'Cache-Control':'no-store'}});
}
