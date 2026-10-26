import { test,expect } from '@playwright/test';
test('editable starter, three demo cards, durable Library, profile review and draft safety',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'AI FDE roles · Shanghai'}).click();
 const composer=page.getByRole('textbox',{name:'Describe the opportunities you want'});
 await expect(composer).toHaveValue(/FDE/);
 await expect(page.locator('.opportunity')).toHaveCount(0);
 await composer.fill('Find remote AI FDE opportunities, contract only, no full-time');
 await expect(page.getByRole('button',{name:'Send search'})).toBeEnabled();
 if(await page.getByRole('button',{name:'Live search',exact:true}).count())await page.getByRole('button',{name:'Live search',exact:true}).click();
 await page.getByRole('button',{name:'Send search'}).click();
 await expect(page.locator('.opportunity')).toHaveCount(3);
 const profileGate=page.getByRole('dialog',{name:'Complete your profile before a new chat'});if(await profileGate.isVisible())await profileGate.getByRole('button',{name:'Continue this chat and explore results'}).click();
 await expect(page.getByText('DEMO · FICTIONAL',{exact:true})).toHaveCount(3);
 if(!await page.locator('.opportunity').first().getByRole('button',{name:'Saved',exact:true}).count()) await page.locator('.opportunity').first().getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.getByRole('button',{name:'Saved',exact:true})).toHaveCount(1);
 await page.reload();
 await page.getByRole('button',{name:/Find remote AI FDE opportunities/}).first().click();
 await expect(page.locator('.opportunity')).toHaveCount(3);
 await expect(page.getByRole('button',{name:'Saved',exact:true})).toHaveCount(1);
 await page.getByRole('button',{name:'Prepare outreach'}).first().click();
 await expect(page.getByRole('dialog',{name:'Outreach draft'})).toBeVisible();
 await expect(page.getByText(/Draft only · Nothing has been sent/)).toBeVisible();
 await expect(page.getByRole('button',{name:'I sent it elsewhere'})).toBeDisabled();
 await page.getByRole('button',{name:'Close draft'}).click();
 await page.getByRole('button',{name:/^Library/}).click();
 await page.locator('.library-row').first().click();
 await page.getByLabel('Opportunity stage').selectOption('WAITING');
 await expect(page.locator('.timeline').getByText('You marked this waiting')).toBeVisible();
 await page.getByLabel('Opportunity notes').fill('Follow up next week');
 await page.getByRole('button',{name:'Save notes'}).click();
 await page.getByRole('button',{name:'Close opportunity'}).click();
 await page.getByRole('button',{name:'Profile & résumé'}).click();
 const fileName='test-resume-'+Date.now()+'.txt';
 await page.getByLabel('Upload résumé',{exact:true}).setInputFiles({name:fileName,mimeType:'text/plain',buffer:Buffer.from('Test Person\nSkills: Python, AI evaluation, training.\nBuilt evaluation projects.')});
 await expect(page.getByLabel('Résumé extraction preview')).toContainText('Test Person');
 await page.getByLabel('Your name',{exact:true}).fill('Test Person');
 await page.getByLabel('Use confirmed skills for matching').check();
 await page.getByRole('button',{name:'Confirm & save profile'}).click();
 await expect(page.getByText('Profile confirmed. You can start a new chat; opportunity matching has been updated.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Delete résumé '+fileName}).click();
 await expect(page.getByText(fileName,{exact:true})).toHaveCount(0);
});
test('invalid inputs and cross-origin mutations are rejected',async({request})=>{
 const invalid=await request.post('/api/chat',{data:{message:'',demo:true}});expect(invalid.status()).toBe(400);
 const cross=await request.patch('/api/profile',{headers:{origin:'https://evil.example'},data:{}});expect(cross.status()).toBe(403);
 const upload=await request.post('/api/profile/resume',{multipart:{file:{name:'bad.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a pdf')}}});expect(upload.status()).toBe(422);
});
test('mobile layout has no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.getByRole('heading',{name:/Good things grow/})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Open navigation'}).click();await expect(page.getByRole('button',{name:'Profile & résumé'})).toBeVisible();
});

test('real PDF and DOCX parsing previews can be deleted',async({request})=>{
 for(const [name,mimeType] of [['resume.pdf','application/pdf'],['resume.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document']]){
  const {readFileSync}=await import('node:fs');const {resolve}=await import('node:path');
  const uploaded=await request.post('/api/profile/resume',{multipart:{file:{name,mimeType,buffer:readFileSync(resolve('tests/fixtures',name))}}});
  expect(uploaded.status()).toBe(200);const body=await uploaded.json();expect(body.preview).toContain('Fictional Test Profile');
  const removed=await request.delete('/api/profile/resume/'+body.id);expect(removed.status()).toBe(200);
 }
});
