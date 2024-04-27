
module.exports = async function UpdateAppointment(fastify, opts) {

    fastify.post('/update', async (request, reply) => {
        const { body } = request;
        const apiName = 'updateAppointment';


        if (!body.appointmentId || !body.clientId || !body.consultantId || !body.appointmentStartDate || !body.appointmentEndDate
            || !body.appointmentStartTime || !body.appointmentEndTime || !body.appointmentTitle) {
            reply.code(400);
            return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
        }

        try {
            const existingAppointment = await fastify.appdb('appointments as s')
                .select('*')
                .where('appointment_id', body.appointmentId)
                .first();

            if (!existingAppointment) {
                reply.code(404);
                return fastify.lib.returnMessage('Appointment ID is invalid!', 404);
            }

            await fastify.appdb.transaction(async (trx) => {
                const userChangeFields = {
                    user_id: body.clientId,
                    recipient_id: body.consultantId || null,
                    appointment_start_date: body.appointmentStartDate,
                    appointment_end_date: body.appointmentEndDate || null,
                    appointment_start_time: body.appointmentStartTime || null,
                    appointment_end_time: body.appointmentEndTime || null,
                    appointment_title: body.appointmentTitle || null,
                    appointment_description: body.appointmentDescription || null,
                };
                const updateUserData = Object.entries(userChangeFields).reduce((data, [key, value]) => {
                    if (String(existingStaff[key]) !== String(value)) {
                        data[key] = value;
                    }
                    return data;
                }, {});

                if (Object.keys(updateUserData).length > 0) {
                    await trx('appointments')
                        .where('appointment_id', existingAppointment.appointment_id)
                        .update({
                            ...updateUserData,
                            updated_date: new Date(),
                        });
                }

            });

            fastify.log.info(`${apiName}-Appointment updated successfully:`, { appointmentId: body.appointmentId });
            return fastify.lib.returnMessage('Appointment updated successfully!', 200);
        } catch (error) {
            fastify.log.error(`${apiName}-Error updating Appointment:`, error);
            throw new Error('Error updating Appointment');
        }
    });

};
