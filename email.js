// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function send(email_addresses, store){
  const msg = {
    to: email_addresses,
    from: 'IKEA Click & Collect Availability <notification@ikea-status.dong.st>',
    subject: `IKEA ${store.name} Now Open for Click & Collect Orders`,
    html: `
<p>Good News! <strong>IKEA ${store.name}</strong> is now open for Click & Collect orders. Act fast!</p>
<p><a href="https://www.ikea.com" target="_blank">Direct link to IKEA Homepage</a></p>
<p>If you like my service, please share it with your friend and <a href="https://www.buymeacoffee.com/dongst" target="_blank">buy me a coffee here</a>, or <a href="https://www.gofundme.com/f/ikea-click-amp-collect-availability-website?utm_source=customer&utm_medium=copy_link-tip&utm_campaign=p_cp+share-sheet" target="_blank">donate on gofundme</a>. Thank you. ;)</p>
<p>dongst</p>
<br>
<p>--------------------</p>
<p>This is a beta version of email notification from my website, <a href="https://ikea-status.dong.st">IKEA Click & Collect Availability</a>.</p>
<p>Do not reply to this email. <a href="https://www.reddit.com/r/IKEA/comments/gpl3x0/ikea_click_collect_status_website/">Provide feedback here.</a></p>
<p>To unsubscribe, <a href="https://ikea-status.dong.st/#subscribe-container" target="_blank">go to my website</a>, type in your email address and click "Unsubscribe all". </p>
<p><small>This is not an email from IKEA. IKEA® is a registered trademark of Inter-IKEA Systems B.V. in the U.S. and other countries.</small></p>
`
  };
  sgMail
    .sendMultiple(msg)
    .then(() => {
      // Celebrate
    })
    .catch(error => {
      // Log friendly error
      console.error(error);

      if (error.response) {
        // Extract error msg
        const {message, code, response} = error;

        // Extract response msg
        const {headers, body} = response;

        console.error(body);
      }
    });
}

function confirm(email_address, store_names){
  const msg = {
    to: email_address,
    from: 'IKEA Click & Collect Availability <notification@ikea-status.dong.st>',
    subject: `Subscription Confirmation`,
    html: `
<p>Hi, there!</p>
<p>You've subscribed to email notification of the latest availability at <strong>IKEA ${store_names.join(', ')}</strong>. A single email will be sent to you whenever any of your locations open for new Click & Collect order.</p>
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
`
  };
  sgMail
    .sendMultiple(msg)
    .then(() => {
      // Celebrate
    })
    .catch(error => {
      // Log friendly error
      console.error(error);

      if (error.response) {
        // Extract error msg
        const {message, code, response} = error;

        // Extract response msg
        const {headers, body} = response;

        console.error(body);
      }
    });
}

exports.send = send;
exports.confirm = confirm;
