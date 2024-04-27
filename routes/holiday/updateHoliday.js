
// const { STATUS, ACTIVECD } = require('../../global-constant.js');

module.exports = async function Updateholiday(fastify, opts) {

  fastify.post('/update', async (request, reply) => {
    const { body, headers } = request;
    const apiName = 'updateHoliday';
    // const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD)


    if (!body.userId || !body.holidayId || !body.holidayName || !body.holidayDate) {
      reply.code(400);
      return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
    }

    // try {

    const existingholidays = await fastify.appdb('holidays')
      .select('*')
      .where('holiday_id', body.holidayId)
      .first();

    if (!existingholidays) {
      reply.code(404);
      return fastify.lib.returnMessage('Holiday ID is invalid!', 404);
    }
    const holidayDate = new Date(body.holidayDate);

    await fastify.appdb.transaction(async (trx) => {

      // const duplicateFields = [];
      // const alreadyHolidays = await trx('holidays')
      //   .select(['holiday_date']);

      // const existingHolidaysTimestamps = alreadyHolidays.map((holi) => new Date(holi.holiday_date).getTime());
      // const holidayDateTimestamp = holidayDate.getTime();

      // const isHolidayTaken = existingHolidaysTimestamps.includes(holidayDateTimestamp);
      // if (isHolidayTaken) {
      //   duplicateFields.push('Holiday Date');
      // }

      // const checkOfficeEmail = await fastify.appdb('holidays')
      //   .select(['holiday_name'])
      //   .where({ holiday_name: body.holidayName });

      // if (checkOfficeEmail.length > 0) {
      //   duplicateFields.push('Holiday Name');
      // }
      // if (duplicateFields.length > 0) {
      //   fastify.log.error(`${apiName}-Duplicate fields found:`, duplicateFields);
      //   return reply.code(400).send({ error: 'Duplicate fields found', duplicateFields });
      // }

      const userChangeFields = {
        holiday_name: body.holidayName,
        holiday_date: holidayDate,
        holiday_description: body.holidayDescription || null,
        holiday_availability: body.holidayAvailability || null,
        user_id: body.userId,
      };
      const updateUserData = Object.entries(userChangeFields).reduce((data, [key, value]) => {
        if (String(existingholidays[key]) !== String(value)) {
          data[key] = value;
        }
        return data;
      }, {});

      if (Object.keys(updateUserData).length > 0) {
        await trx('holidays')
          .where('holiday_id', existingholidays.holiday_id)
          .update({
            ...updateUserData,
            updated_date: new Date(),
          });
      }

    });

    fastify.log.info(`${apiName}-holiday updated successfully:`, { holidayId: body.holidayId });
    return fastify.lib.returnMessage('holiday updated successfully!', 200);
    // } catch (error) {
    //   fastify.log.error(`${apiName}-Error updating holiday:`, error);
    //   throw new Error('Error updating holiday');
    // }
  });

};
