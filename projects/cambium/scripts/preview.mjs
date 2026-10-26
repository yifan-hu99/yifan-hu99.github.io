import { chromium } from 'playwright';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.on('pageerror',e=>console.error('Browser error:',e.message));
const discovered=page.waitForResponse(r=>r.url().includes('/api/discover'));
const state=page.waitForResponse(r=>r.url().includes('/api/state'));await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3000');await state;await discovered;await page.locator('.home-opportunity').first().waitFor();
await page.screenshot({path:'../cambium-desktop.png',fullPage:true});
await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'../cambium-mobile.png',fullPage:true});
await browser.close();
