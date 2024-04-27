const { STATUS, ACTIVECD } = require('../../global-constant.js');

module.exports = async function AddService(fastify, opts) {

    fastify.post('/add', async (request, reply) => {
        const { body } = request;
        const apiName = 'AddService'

        const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD)

        if (!body.userId || !body.serviceName || !body.serviceHours || !body.servicePayment) {
            reply.code(400);
            return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
        }

        let service;

        // try {
        await fastify.appdb.transaction(async (trx) => {
            const serviceId = await trx('services')
                .insert({
                    service_name: body.serviceName,
                    user_id: body.userId,
                    service_hour: body.serviceHours || null,
                    service_payment: body.servicePayment,
                    service_description: body.serviceDescription || null,
                    service_availability: body.serviceAvailability || null,
                    picture_id: body.pictureId || null,
                    created_date: new Date(),
                });

            service = await trx('services')
                .select({ serviceId: 'service_id' })
                .where({ service_id: body.serviceId ? body.serviceId : serviceId[0] })
                .first();
        });
        // } catch (error) {
        //     fastify.log.error(`${apiName}-Error executing transaction:`, error);
        //     throw new Error('Error submitting Services');
        // }

        fastify.log.info(`${apiName}-Services added successfully:`, { service });
        return { ...service };
    });

};
