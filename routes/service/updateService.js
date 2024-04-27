
const { STATUS, ACTIVECD } = require('../../global-constant.js');

module.exports = async function UpdateService(fastify, opts) {

  fastify.post('/update', async (request, reply) => {
    const { body, headers } = request;
    const apiName = 'updateService';
    const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD)


    if (!body.userId || !body.serviceName || !body.serviceHours || !body.servicePayment) {
      reply.code(400);
      return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
    }

    try {
      const existingHolidays = await fastify.appdb('services as s')
        .select('*')
        .where('service_id', body.serviceId)
        .first();

      if (!existingHolidays) {
        reply.code(404);
        return fastify.lib.returnMessage('Service ID is invalid!', 404);
      }

      await fastify.appdb.transaction(async (trx) => {
        const userChangeFields = {
          service_name: body.serviceName,
          user_id: body.userId,
          service_hour: body.serviceHours || null,
          service_payment: body.servicePayment,
          service_description: body.serviceDescription || null,
          service_availability: body.serviceAvailability || null,
          picture_id: body.pictureId || null,
        };
        const updateUserData = Object.entries(userChangeFields).reduce((data, [key, value]) => {
          if (String(existingHolidays[key]) !== String(value)) {
            data[key] = value;
          }
          return data;
        }, {});

        if (Object.keys(updateUserData).length > 0) {
          await trx('services')
            .where('service_id', existingHolidays.service_id)
            .update({
              ...updateUserData,
              updated_date: new Date(),
            });
        }

      });

      fastify.log.info(`${apiName}-Service updated successfully:`, { serviceId: body.serviceId });
      return fastify.lib.returnMessage('Service updated successfully!', 200);
    } catch (error) {
      fastify.log.error(`${apiName}-Error updating Service:`, error);
      throw new Error('Error updating Service');
    }
  });

};
