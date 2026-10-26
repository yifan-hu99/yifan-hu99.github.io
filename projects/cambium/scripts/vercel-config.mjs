/** @param {Record<string, string | undefined>} env */
export function vercelRuntime(env=process.env){
 if(!/^postgres(?:ql)?:\/\//.test(env.DATABASE_URL||''))throw new Error('Connect a PostgreSQL database and configure DATABASE_URL before deploying.');
 if(!env.APP_ACCESS_PASSWORD||env.APP_ACCESS_PASSWORD.length<16)throw new Error('APP_ACCESS_PASSWORD must contain at least 16 characters.');
 if(env.DIRECT_URL&&!/^postgres(?:ql)?:\/\//.test(env.DIRECT_URL))throw new Error('DIRECT_URL must be a PostgreSQL migration connection string.');
 const direct=env.DIRECT_URL||env.DATABASE_URL_UNPOOLED||env.POSTGRES_URL_NON_POOLING||env.DATABASE_URL;
 if(!/^postgres(?:ql)?:\/\//.test(direct||''))throw new Error('Invalid migration database URL.');
 return {...env,DIRECT_URL:direct,VERCEL:'1'};
}
