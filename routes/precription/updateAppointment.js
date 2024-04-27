
module.exports = async function UpdateAppointment(fastify, opts) {

    fastify.post('/update', async (request, reply) => {
        const { body } = request;
        const apiName = 'updatePrescription';


        if (!body.appointmentId || !body.clientId || !body.consultantId || !body.prescriptionId) {
            reply.code(400);
            return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
        }

        try {
            const existingAppointment = await fastify.appdb('precription_details as s')
                .select('*')
                .where('prescription_id', body.prescriptionId)
                .first();

            if (!existingAppointment) {
                reply.code(404);
                return fastify.lib.returnMessage('Prescription ID is invalid!', 404);
            }

            await fastify.appdb.transaction(async (trx) => {
                const userChangeFields = {
                    user_id: body.clientId,
                    consultant_id: body.consultantId || null,
                    appointment_id: body.appointmentId || null,
                    prescription_des: body.precriptionDescription || null,
                };
                const updateUserData = Object.entries(userChangeFields).reduce((data, [key, value]) => {
                    if (String(existingStaff[key]) !== String(value)) {
                        data[key] = value;
                    }
                    return data;
                }, {});

                if (Object.keys(updateUserData).length > 0) {
                    await trx('precription_details')
                        .where('prescription_id', existingAppointment.prescription_id)
                        .update({
                            ...updateUserData,
                            updated_date: new Date(),
                        });
                }

            });

            fastify.log.info(`${apiName}-Appointment Prescription updated successfully:`, { prescriptionId: body.prescriptionId });
            return fastify.lib.returnMessage('Appointment Prescription updated successfully!', 200);
        } catch (error) {
            fastify.log.error(`${apiName}-Error updating Appointment Prescription:`, error);
            throw new Error('Error updating Appointment Prescription');
        }
    });

};
