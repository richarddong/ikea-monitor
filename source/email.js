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
<p>This is a beta version of email notification from my website, <a href="https://ikea-status.dong.st">IKEA Click & Collect Availability</a>.</p>
<p>Do not reply to this email. <a href="https://www.reddit.com/r/IKEA/comments/gpl3x0/ikea_click_collect_status_website/">Provide feedback here.</a></p>
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
<p>This is a beta version of email notification from my website, <a href="https://ikea-status.dong.st">IKEA Click & Collect Availability</a>.</p>
<p>Do not reply to this email. <a href="https://www.reddit.com/r/IKEA/comments/gpl3x0/ikea_click_collect_status_website/">Provide feedback here.</a></p>
<p>To unsubscribe, <a href="https://ikea-status.dong.st/#subscribe-container" target="_blank">go to my website</a>, type in your email address and click "Unsubscribe all". </p>
<p><small>This is not an email from IKEA. IKEA® is a registered trademark of Inter-IKEA Systems B.V. in the U.S. and other countries.</small></p>
`};
}

async function send(emailAddresses, message){
  message.to = emailAddresses;
  return sgMail.sendMultiple(message);
}

exports.subscriptionConfirmationMsg = subscriptionConfirmationMsg;
exports.notificationMsg = notificationMsg;
exports.send = send;
