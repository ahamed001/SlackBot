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
app.view('approval_request', async ({ ack, body, view, client }) => {
    await ack();
  
    // Extract necessary information from the view submission
    const approver = view.state.values.approver_block.approver.selected_user;
    const approvalText = view.state.values.text_block.approval_text.value;
    const requester = body.user.id;
  
    try {
      // Send the approval request message to the approver
      const result = await client.chat.postMessage({
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
                value: `${requester}:${approvalText}`, // Include requester and approval text in the value
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Reject',
                },
                style: 'danger',
                action_id: 'reject',
                value: requester, // Only include requester in the value
              },
            ],
          },
        ],
      });
  
      // Log the result
      console.log('Approval request message sent:', result);
  
    } catch (error) {
      console.error('Error sending approval request message:', error);
    }
  });
  
  // Handle approve/reject button actions
  app.action('approve', async ({ ack, body, client }) => {
    await ack();
  
    // Extract requester ID and approval text from the action value
    const [requester, approvalText] = body.actions[0].value.split(':');
  
    try {
      // Notify the requester about the approval
      await client.chat.postMessage({
        channel: requester,
        text: `Your approval request has been approved by <@${body.user.id}>.`,
      });
  
      // Log the approval notification
      console.log('Approval notification sent to requester');
    } catch (error) {
      console.error('Error sending approval notification to requester:', error);
    }
  });
  
  app.action('reject', async ({ ack, body, client }) => {
    await ack();
  
    // Extract requester ID from the action value
    const requester = body.actions[0].value;
  
    try {
      // Notify the requester about the rejection
      await client.chat.postMessage({
        channel: requester,
        text: `Your approval request has been rejected by <@${body.user.id}>.`,
      });
  
      // Log the rejection notification
      console.log('Rejection notification sent to requester');
    } catch (error) {
      console.error('Error sending rejection notification to requester:', error);
    }
  });
  