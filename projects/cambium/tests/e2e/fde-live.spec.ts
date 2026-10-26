import { test,expect } from '@playwright/test';
test('Shanghai FDE prompt returns three real recruitment cards in English',async({page,request})=>{
 test.setTimeout(150000);
 test.skip(process.env.RUN_LIVE_PROVIDER_TESTS!=='true','Opt-in test that uses configured live providers.');
 const h=await request.get('/api/source-health');const sources=await h.json();
 expect(sources.find((s:{id:string})=>s.id==='WeChat')?.status).toBe('configured');
 await page.goto('/');
 const composer=page.getByRole('textbox',{name:'Describe the opportunities you want'});
 await composer.fill('Find AI Forward Deployed Engineer (FDE) jobs in Shanghai. I want to build and deploy AI solutions for customers. Full-time preferred; include the original job posting and how to apply.');
 await expect(page.getByRole('button',{name:'Send search'})).toBeEnabled();
 if(await page.getByRole('button',{name:'Demo workspace',exact:true}).count())await page.getByRole('button',{name:'Demo workspace',exact:true}).click();
 await page.getByRole('button',{name:'Send search'}).click();
 await expect(page.locator('.opportunity')).toHaveCount(3,{timeout:90000});
 const profileGate=page.getByRole('dialog',{name:'Complete your profile before a new chat'});if(await profileGate.isVisible())await profileGate.getByRole('button',{name:'Continue this chat and explore results'}).click();
 await expect(page.locator('.opportunity .demo-pill')).toHaveCount(0);
 const cards=page.locator('.opportunity');
 expect((await cards.allTextContents()).join(' ')).not.toMatch(/\p{Script=Han}/u);
 for(let i=0;i<3;i++){
  await expect(cards.nth(i).locator('.metadata')).toContainText(/Shanghai|unconfirmed/);
  await expect(cards.nth(i).getByRole('link',{name:'View original'})).toHaveAttribute('href',/^https:\/\/(mp\.weixin\.qq\.com|www\.xiaohongshu\.com)\//);
 }
 await expect(cards.first().locator('.brief-section')).toHaveCount(0);await cards.first().getByRole('button',{name:'View details',exact:true}).click();await expect(cards.first().locator('.brief-section')).toHaveCount(6);
 expect(await page.locator('.opportunity-highlights a[href^="mailto:"]').count()).toBeGreaterThan(0);
 await expect(page.locator('.opportunity .fit').first()).toContainText('Explicit FDE');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.screenshot({path:'../cambium-fde-results.png',fullPage:true});
});
