import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
const { generateText } = await import('ai');

async function main(){
  try{
    const key = process.env.OPENROUTER_API_KEY;
    if(!key){
      console.error('MISSING_KEY');
      process.exit(2);
    }
    const gateway = createOpenAICompatible({
      name: 'openrouter',
      // official OpenRouter base URL per quickstart
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: key,
      supportsStructuredOutputs: false,
    });
    // use recommended latest alias
    const model = gateway('~openai/gpt-latest');
    const res = await generateText({ model, prompt: 'Say hello' });
    console.log('OK', typeof res.text === 'string' ? res.text.slice(0,200) : JSON.stringify(res));
  }catch(err){
    try{
      const util = await import('util');
      console.error('ERR_VERBOSE', util.inspect(err, { showHidden: true, depth: 5 }));
    }catch(e){
      console.error('ERR', err && err.message ? err.message : String(err));
    }
    process.exit(1);
  }
}

main();
