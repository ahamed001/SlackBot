const { App, ExpressReceiver } = require('@slack/bolt');
require('dotenv').config();

// Slack app initialization
const receiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET });
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

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
app.view('approval_request', async({ ack, body, view, client }))
