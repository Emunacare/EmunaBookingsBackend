const { STATUS, ACTIVECD, USERCD, ROLE } = require('../../global-constant.js');

module.exports = async function AddUser(fastify, opts) {



    fastify.post('/add', async (request, reply) => {
        const { body } = request;
        const apiName = 'AddUser'
        const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD)
        const role = await fastify.lib.getLookUpId(fastify, ROLE, USERCD)

        if (!body.firstName || !body.officeEmail) {
            reply.code(400);
            return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
        }

        const duplicateFields = [];
        const checkOfficeEmail = await fastify.appdb('users')
            .select(['office_email', 'user_id'])
            .where({ office_email: body.officeEmail });

        if (checkOfficeEmail.length > 0) {
            duplicateFields.push('office email');
        }
        if (duplicateFields.length > 0) {
            const { user_id } = checkOfficeEmail[0];
            fastify.log.error(`${apiName}-Duplicate fields found:`, checkOfficeEmail, duplicateFields);
            return reply.code(400).send({ error: 'Duplicate fields found', userId: user_id, duplicateFields });
        }

        let user, workingHour, socialLink, createdWorkingList = [];
        // try {
        await fastify.appdb.transaction(async (trx) => {
            const userId = await trx('users')
                .insert({
                    first_name: body.firstName,
                    last_name: body.lastName || null,
                    office_email: body.officeEmail,
                    personal_email: body.personalEmail || null,
                    office_phone: body.officePhone || null,
                    personal_phone: body.personalPhone || null,
                    address: body.address || null,
                    position: body.position || null,
                    about: body.profileAbout || null,
                    picture_id: body.pictureId || null,
                    picture: body.picture || null,
                    social_media_id: null,
                    service_id: null,
                    holiday_id: null,
                    working_hour_id: null,
                    status_id: status,
                    role_id: role,
                    created_date: new Date(),
                });

            user = await trx('users')
                .select({ userId: 'user_id' })
                .where({ user_id: body.userId ? body.userId : userId[0] })
                .first();

            const socialLinkId = await trx('social_media_links')
                .insert({
                    user_id: user.userId,
                });
            socialLink = await trx('social_media_links')
                .select({ socialLinkId: 'social_link_id' })
                .where({ working_hour_id: body.socialLinkId ? body.socialLinkId : socialLinkId[0] })
                .first();

            const response = await fastify.lib.getLookupItemByKey("WEEKDAY");
            if (response) {
                await Promise.all(response.rows.map(async (day) => {
                    const workingHourId = await trx('working_hours')
                        .insert({
                            weekday_id: day.id,
                            user_id: user.userId,
                            working_hour_status: status,
                            created_date: new Date(),
                        });

                    workingHour = await trx('working_hours')
                        .select({ workingHourId: 'working_hour_id' })
                        .where({ working_hour_id: body.workingHourId ? body.workingHourId : workingHourId[0] })
                        .first();

                    createdWorkingList.push(workingHour);
                }));
            }


        });
        // } catch (error) {
        //     fastify.log.error(`${apiName}-Error executing transaction:`, error);
        //     throw new Error('Error submitting User');
        // }

        fastify.log.info(`${apiName}-User added successfully:`, { user, createdWorkingList });
        return { ...user, ...createdWorkingList, ...socialLink };
    });

};
