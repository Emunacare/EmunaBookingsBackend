
const { STATUS, ACTIVECD, USERCD, ROLE } = require('../../global-constant.js');

module.exports = async function updateStaff(fastify, opts) {

  fastify.post('/update', async (request, reply) => {
    const { body, headers } = request;
    const apiName = 'updateUser';
    const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD)
    const role = await fastify.lib.getLookUpId(fastify, ROLE, USERCD)

    if (!body.userId || !body.firstName || !body.officeEmail) {
      reply.code(400);
      return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
    }

    try {
      const duplicateFields = [];
      const existingStaff = await fastify.appdb('users as s')
        .select('*')
        .where('user_id', body.userId)
        .first();

      if (!existingStaff) {
        reply.code(404);
        return fastify.lib.returnMessage('User ID is invalid!', 404);
      }

      // Check office email validation
      if (existingStaff.office_email !== body.officeEmail) {
        checkofficeEmail = await fastify.appdb('users')
          .select(['office_email'])
          .where({ office_email: body.officeEmail });

        if (checkofficeEmail.length > 0) {
          duplicateFields.push('office email');
        }
      }

      if (duplicateFields.length > 0) {
        reply.code(400);
        fastify.log.error(`${apiName}-Duplicate fields found:`, duplicateFields);
        return reply.send({ error: 'Duplicate fields found', duplicateFields });
      }

      await fastify.appdb.transaction(async (trx) => {
        const userChangeFields = {
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
          role_id: body.roleId || role,
          social_media_id: null,
          service_id: null,
          holiday_id: null,
          working_hour_id: null,
          working_hour_id: null,
        };
        const updateUserData = Object.entries(userChangeFields).reduce((data, [key, value]) => {
          if (String(existingStaff[key]) !== String(value)) {
            data[key] = value;
          }
          return data;
        }, {});

        if (Object.keys(updateUserData).length > 0) {
          await trx('users')
            .where('user_id', existingStaff.user_id)
            .update({
              ...updateUserData,
              updated_date: new Date(),
            });
        }

        // let getStaffQuery = await trx('users as u')
        //         .select(
        //             'u.user_id as userId',
        //             's.staff_id as staffId',
        //             'u.first_name as firstName',
        //             'u.last_name as lastName',
        //             'u.office_phone as officePhone',
        //             'u.personal_phone as personalPhone',
        //             'u.email as personalEmail',
        //             'u.office_email as officeEmail',
        //             'p.file_name as pictureName',
        //             'a.address_line1 as addressLine1',
        //             'a.address_line2 as addressLine2',
        //             'a.city as city',
        //             'a.pincode as pincode',
        //             'ld1.dtl_desc as status',
        //             'ld.dtl_desc as role',
        //             'ld2.dtl_desc as country',
        //             'ld3.dtl_desc as state',
        //         )
        //         .leftJoin('staff as s', 'u.user_id', 's.user_id')
        //         .leftJoin('address as a', 'a.address_id', 'u.address_id')
        //         .leftJoin('lookup_details as ld', 'ld.lookup_dtl_id', 's.role_id')
        //         .leftJoin('lookup_details as ld1', 'ld1.lookup_dtl_id', 's.status_id')
        //         .leftJoin('lookup_details as ld3', 'ld3.lookup_dtl_id', 'a.state')
        //         .leftJoin('lookup_details as ld2', 'ld2.lookup_dtl_id', 'a.country')
        //         .leftJoin('pictures as p', 'p.picture_id', 'u.picture_id')
        //         .where({ 's.staff_id': body.staffId })

        //         const staffResult = await getStaffQuery
        //         // Insert Audit
        //         const auditStaff = await trx('audit_log')
        //             .insert({
        //                 screen_name: 'StaffScreen',
        //                 input_json: JSON.stringify(staffResult),
        //                 created_by: body.createdBy,
        //                 created_date: new Date(),
        //             });
      });

      fastify.log.info(`${apiName}-User updated successfully:`, { staffId: body.userId });
      return fastify.lib.returnMessage('User updated successfully!', 200);
    } catch (error) {
      fastify.log.error(`${apiName}-Error updating User:`, error);
      throw new Error('Error updating User');
    }
  });

};
