const { App, ExpressReceiver } = require('@slack/bolt');
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// Slack app initialization
const receiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET });
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

// Express app initialization
const expressApp = express();
expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use(bodyParser.json());

// Handle /approval-test slash command
app.command('/approval-test', async ({ ack, body, client }) => {
  await ack();
  
  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'approval_request',
        title: {
          type: 'plain_text',
          text: 'Request Approval',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'approver_block',
            element: {
              type: 'users_select',
              action_id: 'approver',
              placeholder: {
                type: 'plain_text',
                text: 'Select an approver',
              },
            },
            label: {
              type: 'plain_text',
              text: 'Approver',
            },
          },
          {
            type: 'input',
            block_id: 'text_block',
            element: {
              type: 'plain_text_input',
              multiline: true,
              action_id: 'approval_text',
            },
            label: {
              type: 'plain_text',
              text: 'Approval Text',
            },
          },
        ],
        submit: {
          type: 'plain_text',
          text: 'Submit',
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
});

// Handle view submission
app.view('approval_request', async ({ ack, body, view, client }) => {
  await ack();

  const approver = view.state.values.approver_block.approver.selected_user;
  const approvalText = view.state.values.text_block.approval_text.value;
  const requester = body.user.id;

  try {
    await client.chat.postMessage({
      channel: approver,
      text: `You have a new approval request from <@${requester}>:`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Approval Request*\n\n${approvalText}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Approve',
              },
              style: 'primary',
              action_id: 'approve',
              value: requester,
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Reject',
              },
              style: 'danger',
              action_id: 'reject',
              value: requester,
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error(error);
  }
});

// Handle approve/reject button actions
app.action('approve', async ({ ack, body, client }) => {
  await ack();
  const requester = body.actions[0].value;

  try {
    await client.chat.postMessage({
      channel: requester,
      text: `Your approval request has been approved by <@${body.user.id}>.`,
    });
  } catch (error) {
    console.error(error);
  }
});

app.action('reject', async ({ ack, body, client }) => {
  await ack();
  const requester = body.actions[0].value;

  try {
    await client.chat.postMessage({
      channel: requester,
      text: `Your approval request has been rejected by <@${body.user.id}>.`,
    });
  } catch (error) {
    console.error(error);
  }
});

// Set up Express receiver to handle slash command requests
receiver.router.post('/slack/events', expressApp);

// Export the Express app for Vercel deployment
module.exports = receiver.app;

// Start the Bolt app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log(`SlackBot app is running on port ${process.env.PORT || 3000}!`);
})();