const express = require('express')
const path = require('path');
const axios = require('axios')
const app = express()
const puppeteer = require('puppeteer-extra')
const pluginStealth = require('puppeteer-extra-plugin-stealth')
const { executablePath } = require('puppeteer');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const { timeout } = require('puppeteer');
const cors = require('cors')
const { port } = require('./serverconfig.json');
const { time } = require('console');

app.use(cors({
    origin: ["https://sapidev.ccedev.net", "http://sapidev.ccedev.net","http://localhost:5173"],
    exposedHeaders:"*"

}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

// Public directories to access generated PDFs and PNG's
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

app.set("view engine", "ejs");
app.set('views', __dirname + '/views')
app.set('pdfs', __dirname + '/pdfs')
app.set('trust proxy', true);

app.listen(port, () => {

    console.log(`Listening on port ${port}...`)
})


app.get('/', (req, res) => {

    // Get Today's Date and Time
    const today = new Date()
    const date = `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`
    const time = `${today.getHours()}h${today.getMinutes()}`
    // ---------------------------
    res.send(`API Online ${date}-${time}`)

})


app.get('/testdomainname', async (req, res) => {

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const hostname = req.headers['origin-host']
    console.log(`Request from: ${hostname} with IP ${ip}`)

    console.log('RECEIVED SOMETHING!')
    console.log(req.query)

    const submittedDomain = ((req.query.url).split("//")[1]).split(".")
    const domainName = submittedDomain[0] == 'www' ? submittedDomain[1] : submittedDomain[0]
    console.log(submittedDomain)
    console.log(domainName)
    res.send(domainName)

})

app.get('/checkip', async (req, res) => {

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    console.log(`Request from: ${req.hostname} with IP ${ip}`)
    res.send(`Request from: ${req.hostname} with IP ${ip}`)

})

app.get('/pdf', async (req, res) => {

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const hostname = req.headers['origin-host']
    console.log(`Request from: ${hostname} with IP ${ip}`)

    if (hostname != "sapidev.ccedev.net") {

        res.send("<h1>UNAUTHORIZED.</h1>")

    } else {


        // USE req.query to post url as query string
        // USE req.body to post the url in the request body from form
        console.log('RECEIVED SOMETHING!')
        console.log(req.query)

        // Extract Domain Name
        const submittedDomain = ((req.query.url).split("//")[1]).split(".")
        const domainName = submittedDomain[0] == 'www' ? submittedDomain[1] : submittedDomain[0]
        // ---------------------------

        // Get Today's Date and Time
        const today = new Date()
        const date = `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`
        const time = `${today.getHours()}h${today.getMinutes()}`
        // ---------------------------

        const { url } = req.query
        console.log(url)

        // Use stealth 
        puppeteer.use(pluginStealth())

        // Creates browser instance 
        const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });

        // Creates page instance
        const page = await browser.newPage();


        page.setDefaultNavigationTimeout(300000)

        // If Link is not valid, it will redirect to the form submission via the catch 
        try {

            // Goes to URL and establishes page
            console.log("Navigating to page...")
            const request = await page.goto(url, { waitUntil: 'networkidle2' });

            // THIS SCROLLS TO THE VERY BOTTOM OF THE PAGE
            let prevHeight = -1;
            let maxScrolls = 100;
            let scrollCount = 0;

            while (scrollCount < maxScrolls) {
                // Scroll to the bottom of the page
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

                // Wait for page load
                await page.waitForTimeout(1000);

                // Calculate new scroll height and compare
                let newHeight = await page.evaluate('document.body.scrollHeight');
                if (newHeight == prevHeight) {
                    break;
                }
                prevHeight = newHeight;
                scrollCount += 1;
            }

            const divSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('div'), element => element.textContent));
            const imgSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('img'), element => element.textContent));
            const videoSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('video'), element => element.textContent));
            const iframeSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('iframe'), element => element.textContent));
            const pSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('p'), element => element.textContent));
            const scriptSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('script'), element => element.textContent));
            const anchorSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('a'), element => element.textContent));



            console.log("Waiting For Elements...")
            await page.waitForSelector('body');

            if (divSelectors.length > 0) {
                await page.waitForSelector('div', { timeout: 5_000 });
                console.log("Divs Loaded...")
            }
            if (imgSelectors.length > 0) {
                await page.waitForSelector('img', { timeout: 5_000 });
                console.log("Images Loaded...")
            }
            if (videoSelectors.length > 0) {
                await page.waitForSelector('video', { timeout: 5_000 });
                console.log("Videos Loaded...")
            }
            if (iframeSelectors.length > 0) {
                await page.waitForSelector('iframe', { timeout: 5_000 });
                console.log("Iframes Loaded...")
            }
            if (pSelectors.length > 0) {
                await page.waitForSelector('p', { timeout: 5_000 });
                console.log("P's Loaded...")
            }
            if (scriptSelectors.length > 0) {
                await page.waitForSelector('script', { timeout: 5_000 });
                console.log("Scripts Loaded...")
            }
            if (anchorSelectors.length > 0) {
                await page.waitForSelector('a', { timeout: 5_000 });
                console.log("Anchor Tags Loaded...")
            }





            // await page.waitForSelector('p', { timeout: 5_000 });
            // await page.waitForSelector('a', { timeout: 5_000 });

            console.log("Finished Waiting For Page Load.")
            await page.emulateMediaType('screen');


            // Generates a unique ID for the PDF 
            const fileId = uuid()
            const fileName = `${domainName}_${date}_${time}_${fileId}.pdf`

            // This Block of code allows the custom name of the file and sets the content inline instead of attachement which would download the file
            // Inline downloads the file. 
            // Using this line allows the custom name to populate the file name when user is downloading the file
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename=${fileName}`, 
            });

            // --------------------------------------

            // Remove All Links
            await page.evaluate(_ => {
                // Capture all links and change it to # instead.
                document.querySelectorAll('a')
                    .forEach(a => {
                        a.href = '#'
                    })
            });

            const headerTemplate = `<span style="font-size: 12px; width: 100%; height: auto; background-color: transparent; color: black; margin: 20px;">Domain: ${domainName}<br>Date Of Capture (M-D-Y): ${date} <br> Time Of Capture: ${time}</span>`;
            
            // Prints to PDF and saves under PATH
            const pdf = await page.pdf({
                path: `./pdfs/${domainName}_${date}_${time}_${fileId}.pdf`,
                margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
                printBackground: true,
                format: 'A4',
                displayHeaderFooter:true,
                headerTemplate,
            });



            // Closes the browser session
            await browser.close();

            console.log(fileName)
            res.status(200).send(`/pdfs/${fileName}`);






            // This uses the Filesystem module to delete the generated file after 10 seconds AFTER sending to the client
            // This prevents the server from being overloaded with thousands of unwanted files
            setTimeout(() => {

                fs.unlink(path.join(__dirname, `/pdfs/${fileName}`), function (err) {
                    if (err) throw err;
                    console.log(`File deleted!`);
                });

            }, 10000)


        } catch (e) {


            console.log('There Seems To Be An Error: ' + e)
            res.send(`/pdfs/default.pdf`);




        }


    }






})


app.get('/screenshot', async (req, res) => {

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const hostname = req.headers['origin-host']
    console.log(`Request from: ${hostname} with IP ${ip}`)

    if (hostname != "sapidev.ccedev.net") {

        res.send("<h1>UNAUTHORIZED.</h1>")

    } else {

        console.log(req.hostname)
        // USE req.query to post url as query string
        // USE req.body to post the url in the request body from form
        console.log('RECEIVED SOMETHING!')
        console.log(req.body)
        console.log(req.query)


        // Extract Domain Name
        const submittedDomain = ((req.query.url).split("//")[1]).split(".")
        const domainName = submittedDomain[0] == 'www' ? submittedDomain[1] : submittedDomain[0]
        // ---------------------------

        // Get Today's Date and Time
        const today = new Date()
        const date = `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`
        const time = `${today.getHours()}h${today.getMinutes()}`
        // ---------------------------

        const { url } = req.query
        console.log(url)

        // Use stealth 
        puppeteer.use(pluginStealth())

        // Creates browser instance 
        const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });

        // Creates page instance
        const page = await browser.newPage();

        page.setDefaultNavigationTimeout(300000)

        // If Link is not valid, it will redirect to the form submission via the catch 
        try {


            // Goes to URL and establishes page
            console.log("Navigating to page...")
            await page.goto(url, { waitUntil: 'networkidle2' });


            // THIS SCROLLS TO THE VERY BOTTOM OF THE PAGE
            let prevHeight = -1;
            let maxScrolls = 100;
            let scrollCount = 0;

            while (scrollCount < maxScrolls) {
                // Scroll to the bottom of the page
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                // Wait for page load
                await page.waitForTimeout(1000);
                // Calculate new scroll height and compare
                let newHeight = await page.evaluate('document.body.scrollHeight');
                if (newHeight == prevHeight) {
                    break;
                }
                prevHeight = newHeight;
                scrollCount += 1;
            }

            const divSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('div'), element => element.textContent));
            const imgSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('img'), element => element.textContent));
            const videoSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('video'), element => element.textContent));
            const iframeSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('iframe'), element => element.textContent));
            const pSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('p'), element => element.textContent));
            const scriptSelectors = await page.evaluate(() => Array.from(document.querySelectorAll('script'), element => element.textContent));



            console.log("Waiting For Elements...")
            await page.waitForSelector('body');

            if (divSelectors.length > 0) {
                await page.waitForSelector('div', { timeout: 5_000 });
                console.log("Divs Loaded...")
            }
            if (imgSelectors.length > 0) {
                await page.waitForSelector('img', { timeout: 5_000 });
                console.log("Images Loaded...")
            }
            if (videoSelectors.length > 0) {
                await page.waitForSelector('video', { timeout: 5_000 });
                console.log("Videos Loaded...")
            }
            if (iframeSelectors.length > 0) {
                await page.waitForSelector('iframe', { timeout: 5_000 });
                console.log("Iframes Loaded...")
            }
            if (pSelectors.length > 0) {
                await page.waitForSelector('p', { timeout: 5_000 });
                console.log("P's Loaded...")
            }
            if (scriptSelectors.length > 0) {
                await page.waitForSelector('script', { timeout: 5_000 });
                console.log("Scripts Loaded...")
            }





            console.log("Finished Waiting For Page Load.");
            await page.emulateMediaType('screen');


            // Generates a unique ID for the PDF 
            const fileId = uuid()
            const fileName = `${domainName}_${date}_${time}_${fileId}.png`


            // This Block of code allows the custom name of the file and sets the content inline instead of attachement which would download the file
            // Inline downloads the file. 
            // Using this line allows the custom name to populate the file name when user is downloading the file
            res.set({
                'Content-Type': 'image/png',
                'Content-Disposition': `inline; filename=${fileName}`
            });
            // -------------------------------------


            const wait = t => new Promise((resolve, reject) => setTimeout(resolve, t))

            const generateScreenshot = async (id) => {

                // Takes a Screenshot and saves under PATH
                console.log("Generating Screenshot...")
                await page.screenshot({

                    type: "png", // can also be "jpeg" or "webp" (recommended)
                    path: `./screenshots/${domainName}_${date}_${time}_${id}.png`,  // where to save it
                    fullPage: true,  // will scroll down to capture everything if true

                });

                console.log("Screenshot Successfully Generated")

                // Sends Screenshot to user
                await res.status(200).send(`/screenshots/${fileName}`);


            }


            const deleteAndClose = async (file) => {

                console.log("Deleting File...")
                await fs.unlink(path.join(__dirname, `/screenshots/${fileName}`), function (err) {
                    if (err) throw err;
                    console.log(`File deleted!`);
                });

                // Closes the browser session
                console.log("Closing Browser")
                await browser.close();
                console.log("Session Closed.")


            }


            await wait(10000)

            await generateScreenshot(fileId)

            await wait(10000)

            await deleteAndClose(fileName)






            // This uses the Filesystem module to delete the generated file after 10 seconds AFTER sending to the client
            // This prevents the server from being overloaded with thousands of unwanted files




        } catch (e) {

            console.log('There Seems To Be An Error: ' + e)
            res.send(`/pdfs/default.pdf`);




        }


    }






})










































































































// Developer: Jack Lee Jabra
// License: OpenSource
