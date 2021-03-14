/* eslint-disable no-console */
const sgMail = require('@sendgrid/mail');
const { SENDGRID_API } = require('../config/config');

const sendgridAPIKey = SENDGRID_API;

sgMail.setApiKey(sendgridAPIKey);

const sendEmail = async (options) => {
	const message = {
		from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
		to: options.email,
		subject: options.subject,
		text: options.message,
	};

	const info = await sgMail.send(message);

	console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
