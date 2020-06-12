'use strict';

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function subscriptionConfirmationMsg(locationNames) {
  return {
    from: 'IKEA Click & Collect Availability <notification@ikea-status.dong.st>',
    subject: `Subscription Confirmation`,
    html: `
<p>Hi, there!</p>
<p>You've subscribed to email notification of the latest availability at <strong>IKEA ${locationNames.join(', ')}</strong>. A single email will be sent to you whenever any of your locations open for new Click & Collect order.</p>
<p>To help yourself and other people receive email notification in the future, please kindly add the sender of this email to your contact and "report not spam" if this email is marked spam.</p>
<p>I wish your locations open soon and you get the amazing IKEA products you love.</p>
<p>If you like my service, please share it with your friend and <a href="https://www.buymeacoffee.com/dongst" target="_blank">buy me a coffee here</a>, or <a href="https://www.gofundme.com/f/ikea-click-amp-collect-availability-website?utm_source=customer&utm_medium=copy_link-tip&utm_campaign=p_cp+share-sheet" target="_blank">donate on gofundme</a>. Thank you. ;)</p>
<p>dongst</p>
<br>
<p>--------------------</p>
<p>This is a beta version of email notification from my website, <a target="_blank" href="https://ikea-status.dong.st">IKEA Click & Collect Availability</a>.</p>
<p>Do not reply to this email. <a target="_blank" href="https://www.reddit.com/r/IKEA/comments/gpl3x0/ikea_click_collect_status_website/">Provide feedback here.</a></p>
<p>To unsubscribe, <a href="https://ikea-status.dong.st/#subscribe-container" target="_blank">go to my website</a>, type in your email address and click "Unsubscribe all". </p>
<p><small>This is not an email from IKEA. IKEA® is a registered trademark of Inter-IKEA Systems B.V. in the U.S. and other countries.</small></p>
`};
}

function notificationMsg(locationName) {
  return {
    from: 'IKEA Click & Collect Availability <notification@ikea-status.dong.st>',
    subject: `IKEA ${locationName} Now Open for Click & Collect Orders`,
    html: `
<p>Good News! <strong>IKEA ${locationName}</strong> is now open for Click & Collect orders. Act fast!</p>
<p><a href="https://www.ikea.com" target="_blank">Direct link to IKEA Homepage</a></p>
<p>To help yourself and other people receive email notification in the future, please kindly add the sender of this email to your contact and "report not spam" if this email is marked spam.</p>
<p>If you like my service, please share it with your friend and <a href="https://www.buymeacoffee.com/dongst" target="_blank">buy me a coffee here</a>, or <a href="https://www.gofundme.com/f/ikea-click-amp-collect-availability-website?utm_source=customer&utm_medium=copy_link-tip&utm_campaign=p_cp+share-sheet" target="_blank">donate on gofundme</a>. Thank you. ;)</p>
<p>dongst</p>
<br>
<p>--------------------</p>
<p>This is a beta version of email notification from my website, <a target="_blank" href="https://ikea-status.dong.st">IKEA Click & Collect Availability</a>.</p>
<p>Do not reply to this email. <a target="_blank" href="https://www.reddit.com/r/IKEA/comments/gpl3x0/ikea_click_collect_status_website/">Provide feedback here.</a></p>
<p>To unsubscribe, <a href="https://ikea-status.dong.st/#subscribe-container" target="_blank">go to my website</a>, type in your email address and click "Unsubscribe all". </p>
<p><small>This is not an email from IKEA. IKEA® is a registered trademark of Inter-IKEA Systems B.V. in the U.S. and other countries.</small></p>
`};
}

function serviceSuspensionMsg() {
  return {
    from: 'IKEA Click & Collect Availability <notification@ikea-status.dong.st>',
    subject: `Email Notification Service Suspended`,
    html: `
<p>Hi! This is dongst, the creator of the free IKEA Click & Collect Availability website.</p>
<p>You are receiving this email because you are one of the 17k subscribers to email notifications for the lastest Click & Collect availability of your preferred IKEA locations. If you have already unsubscribed in the last two days, please ignore this email and I will try not to send you any more in the future.</p>
<p>I am sorry. There is a problem that affects email notification subscription after the system upgrade at 1:00 am PDT, June 6, 2020. To ensure that you do not receive any unwanted email, the entire email notification service is suspended until the problem is fixed.</p>
<p>I will try to recover existing subscriptions so that you will be receiving notification again automatically. If you want an alert when the service is recovered, please <a target="_blank" href="https://cdn.forms-content.sg-form.com/4872fab1-a866-11ea-b2f7-3ed1c81e32ba">click here</a>.</p>
<p>The latest availabilities shown on <a href="https://ikea-status.dong.st" target="_blank">my website</a> will be updated and not affected by the problem.</p>
<p>Tomorrow is my birthday and I will not be working on this project. I will try to fix the problem as soon as possible after tomorrow. If you like my service, please share it with your friend and <a href="https://www.buymeacoffee.com/dongst" target="_blank">buy me a coffee here</a>, or <a href="https://www.gofundme.com/f/ikea-click-amp-collect-availability-website?utm_source=customer&utm_medium=copy_link-tip&utm_campaign=p_cp+share-sheet" target="_blank">donate on gofundme</a>. Thank you. ;)</p>
<p>dongst</p>
<br>
<p>--------------------</p>
<p>Do not reply to this email. <a target="_blank" href="https://www.reddit.com/r/IKEA/comments/gpl3x0/ikea_click_collect_status_website/">Provide feedback here.</a></p>
<p><small>This is not an email from IKEA. IKEA® is a registered trademark of Inter-IKEA Systems B.V. in the U.S. and other countries.</small></p>
`};
}

async function send(emailAddresses, message){
  message.to = emailAddresses;
  return sgMail.sendMultiple(message);
}

exports.subscriptionConfirmationMsg = subscriptionConfirmationMsg;
exports.notificationMsg = notificationMsg;
exports.serviceSuspensionMsg = serviceSuspensionMsg;
exports.send = send;
