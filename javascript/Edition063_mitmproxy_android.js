let test = require('ava')
let fs = require('fs-extra')
let os = require('os')
let path = require('path')
let { remote } = require('webdriverio')
let Mitmproxy = require('mitmproxy').default

let proxy, driver
let interceptedMessages = []

// this function will get called every time the proxy intercepts a request
let requestHandler = (message) => {
  let req = message.request
  console.log('************************************')
  console.log('mitmproxy intercepted a request')
  console.log(req.method)
  console.log(req.rawUrl)
  console.log(message.requestBody.toString())
  console.log('************************************')
  interceptedMessages.push(message)
}

test.before(async t => {
  // start mitmproxy
  proxy = await Mitmproxy.Create(requestHandler, [], true, true)

  driver = await remote({
    hostname: 'localhost',
    port: 4723,
    path: '/wd/hub',
    capabilities: {
      platformName: 'Android',
      platformVersion: '9',
      deviceName: 'test-proxy',
      automationName: 'UiAutomator2',
      app: '/Users/jonahss/Workspace/TheApp-v1.9.0.apk', //'https://github.com/cloudgrey-io/the-app/releases/download/v1.9.0/TheApp-v1.9.0.apk',
    },
    logLevel: 'silent'
  })
})

test('getting the event for a day, via request to history.muffinlabs.com', async t => {
  let pickerDemo = await driver.$('~Picker Demo')
  await pickerDemo.click()
  let button = await driver.$('~learnMore')
  await button.click()
  // wait for alert
  let alertIsPresent = async () => {
    try { return await driver.getAlertText(); } catch { return false; }
  }
  await driver.waitUntil(alertIsPresent, 4000)
  await driver.dismissAlert()

  t.true(interceptedMessages.length > 0)
  t.true(interceptedMessages.some(m => /https:\/\/.*\/date\/1\/1/.test(m.request.rawUrl)))
})

test.after.always(async t => {
  t.log('shutting down')
  await proxy.shutdown()
  await driver.deleteSession()
})
