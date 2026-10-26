process.loadEnvFile('.env');
const {searchWechat}=await import('../src/lib/wechat.ts');
const intent={query:'Find AI Forward Deployed Engineer (FDE) jobs in Shanghai. Full-time preferred.',roles:['AI Forward Deployed Engineer','Forward Deployed Engineer','FDE'],location:'Shanghai',remote:false,contract:false,excludeFullTime:false,horizon:60};
const jobs=await searchWechat(intent);
console.log(JSON.stringify({count:jobs.length,jobs:jobs.map(o=>({title:o.title,organization:o.organization,location:o.location,source:o.source,contact:o.contact,publishedAt:o.publishedAt,compensation:o.compensation,tier:o.matchTier,url:o.url}))},null,2));
