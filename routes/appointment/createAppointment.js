const { STATUS, ACTIVECD, INACTIVECD } = require('../../global-constant.js');

module.exports = async function addAppointment(fastify, opts) {
    fastify.post('/add', async (request, reply) => {
        const { query, body } = request;
        const apiName = 'searchAppointment'
        const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD);

        let appointment;

        // try {
        if (!body.clientId || !body.consultantId || !body.appointmentStartDate || !body.appointmentEndDate
            || !body.appointmentStartTime || !body.appointmentEndTime || !body.appointmentTitle) {
            reply.code(400);
            return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
        }
        await fastify.appdb.transaction(async (trx) => {
            const appointmentId = await trx('appointments')
                .insert({
                    user_id: body.clientId,
                    recipient_id: body.consultantId || null,
                    appointment_start_date: body.appointmentStartDate,
                    appointment_end_date: body.appointmentEndDate || null,
                    appointment_start_time: body.appointmentStartTime || null,
                    appointment_end_time: body.appointmentEndTime || null,
                    appointment_title: body.appointmentTitle || null,
                    appointment_description: body.appointmentDescription || null,
                    appointment_status: status,
                    created_date: new Date(),
                });

            appointment = await trx('appointments')
                .select({ appointmentId: 'appointment_id' })
                .where({ appointment_id: body.appointmentId ? body.appointmentId : appointmentId[0] })
                .first();

            const socialLinkId = await trx('precription_details')
                .insert({
                    user_id: user.clientId,
                    appointment_id: appointmentId[0],
                    consultant_id: user.consultantId,
                });
            let socialLink = await trx('precription_details')
                .select({ socialLinkId: 'prescription_id' })
                .where({ prescription_id: body.socialLinkId ? body.socialLinkId : socialLinkId[0] })
                .first();
            // Google Calander Intergration

            // const oauth2Client = new google.auth.OAuth2(
            //     process.env.CLIENT_ID,
            //     process.env.CLIENT_SECRET,
            //     process.env.REDIRECT_URI
            // );

            // oauth2Client.setCredentials({
            //     refresh_token: process.env.REFRESH_TOKEN
            // });

            // const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            // const event = {
            //     summary: body.appointmentTitle,
            //     location: 'Online',
            //     description: body.appointmentDescription,
            //     start: {
            //         dateTime: new Date(body.appointmentStartDate + 'T' + body.appointmentStartTime).toISOString(),
            //         timeZone: 'America/Los_Angeles',
            //     },
            //     end: {
            //         dateTime: new Date(body.appointmentEndDate + 'T' + body.appointmentEndTime).toISOString(),
            //         timeZone: 'America/Los_Angeles',
            //     },
            //     attendees: [
            //         { email: 'clientEmail@example.com' },
            //         { email: 'consultantEmail@example.com' },
            //     ],
            //     reminders: {
            //         useDefault: false,
            //         overrides: [
            //             { method: 'email', minutes: 24 * 60 },
            //             { method: 'popup', minutes: 10 },
            //         ],
            //     },
            // };

            // await calendar.events.insert({
            //     calendarId: 'primary',
            //     resource: event,
            // });






        });
        // }
        //     catch (error) {
        //     fastify.log.error(`${apiName}-Error executing transaction:`, error);
        //     throw new Error('Error submitting Appointment');
        // }

        fastify.log.info(`${apiName}-Appointment added successfully:`, { appointment });
        return { ...appointment };
    });
}