module.exports = async function AddHoliday(fastify, opts) {

    fastify.post('/add', async (request, reply) => {
        const { body } = request;
        const apiName = 'AddHoliday';

        if (!body.userId || !body.holidayName || !body.holidayDate) {
            reply.code(400);
            return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
        }

        let holiday;

        try {
            const holidayDate = new Date(body.holidayDate);
            console.log(holidayDate);
            await fastify.appdb.transaction(async (trx) => {

                // const duplicateFields = [];
                // const alreadyHolidays = await trx('holidays')
                //     .select(['holiday_date']);

                // const existingHolidaysTimestamps = alreadyHolidays.map((holi) => new Date(holi.holiday_date).getTime());
                // const holidayDateTimestamp = holidayDate.getTime();

                // const isHolidayTaken = existingHolidaysTimestamps.includes(holidayDateTimestamp);
                // if (isHolidayTaken) {
                //     duplicateFields.push('Holiday Date');
                // }

                // const checkOfficeEmail = await fastify.appdb('holidays')
                //     .select(['holiday_name'])
                //     .where({ holiday_name: body.holidayName });

                // if (checkOfficeEmail.length > 0) {
                //     duplicateFields.push('Holiday Name');
                // }
                // if (duplicateFields.length > 0) {
                //     fastify.log.error(`${apiName}-Duplicate fields found:`, duplicateFields);
                //     return reply.code(400).send({ error: 'Duplicate fields found', duplicateFields });
                // }

                const holidayId = await trx('holidays')
                    .insert({
                        holiday_name: body.holidayName,
                        holiday_date: holidayDate,
                        holiday_description: body.holidayDescription || null,
                        holiday_availability: body.holidayAvailability || null,
                        user_id: body.userId,
                        created_date: new Date(),
                    });

                holiday = await trx('holidays')
                    .select({ holidayId: 'holiday_id' })
                    .where({ holiday_id: holidayId[0] })
                    .first();
            });
        } catch (error) {
            fastify.log.error(`${apiName}-Error executing transaction:`, error);
            throw new Error('Error submitting Holiday');
        }

        fastify.log.info(`${apiName}-Holiday added successfully:`, { holiday });
        return { ...holiday };
    });

};
