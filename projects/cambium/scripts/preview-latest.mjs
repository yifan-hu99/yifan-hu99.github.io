import {chromium} from 'playwright';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});await page.emulateMedia({reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const state=await (await page.request.get('http://127.0.0.1:3000/api/state')).json();
await page.goto('http://127.0.0.1:3000/?view=updated');
const gate=page.getByRole('dialog',{name:'开启下一轮前完善资料'});
if(state.onboarding.requiredForNewChat){await gate.waitFor();await gate.screenshot({path:'../cambium-profile-gate.png'});await gate.getByRole('button',{name:'先查看已有聊天与本轮结果'}).click();}
await page.locator('.top-navigation').screenshot({path:'../cambium-top-navigation.png'});
for(let i=0;i<Math.min(state.conversations.length,8);i++){
 const c=await (await page.request.get('http://127.0.0.1:3000/api/conversations/'+state.conversations[i].id)).json();
 if(c.messages?.some(m=>m.blocks?.opportunities?.some(o=>!o.demo))){
  await page.locator('.recent-row>button:first-child').nth(i).click();
  await page.locator('.opportunity').first().getByRole('button',{name:'View details',exact:true}).click();await page.locator('.opportunity .brief-section').first().waitFor();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.locator('.opportunity').first().screenshot({path:'../cambium-opportunity-six-sections.png'});
  console.log('Recommended card sections:',await page.locator('.opportunity').first().locator('.brief-section').count());
  break;
 }
}
await page.setViewportSize({width:390,height:844});
console.log('Mobile overflow:',await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
console.log('Browser errors:',errors.length);await browser.close();
