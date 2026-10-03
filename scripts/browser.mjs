import {existsSync} from 'node:fs';
import {chromium} from 'playwright-core';
// CHROME_PATH makes the checks portable. The last candidate recovers this VM.
export function browserOptions(){
 const candidates=[process.env.CHROME_PATH,chromium.executablePath(),'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/home/admin/.cache/ms-playwright/chromium_headless_shell-1193/chrome-linux/headless_shell'].filter(Boolean);
 const executablePath=candidates.find(existsSync);
 if(!executablePath)throw new Error('Chrome was not found. Set CHROME_PATH or run npx playwright-core install chromium.');
 return {executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']};
}
