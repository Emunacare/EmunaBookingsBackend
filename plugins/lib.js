const fp = require('fastify-plugin');
const axios = require('axios');
const _ = require('lodash');

const jwt = require('jsonwebtoken');

function Lib() {

  this.containsText = function containsText(strFull, strPart) {
    const strFullTrimmed = String(strFull).replace(/[^0-9a-zA-Z]+/g, '').toLowerCase();
    const strPartTrimmed = String(strPart).replace(/[^0-9a-zA-Z]+/g, '').toLowerCase();
    return strFullTrimmed.indexOf(strPartTrimmed) >= 0;
  };

  this.equalsText = function equalsText(str1, str2) {
    const first = String(str1).replace(/[^0-9a-zA-Z]+/g, '').toLowerCase();
    const second = String(str2).replace(/[^0-9a-zA-Z]+/g, '').toLowerCase();
    return first === second;
  };

  this.isJsonObject = function isJsonObject(strData) {
    try {
      if (typeof strData === "string")
        JSON.parse(strData);
      else
        return typeof strData === "object"
    } catch (e) {
      return false;
    }
    return true;
  }
  this.generateQRCode = function generateQRCode(data) {
    return Buffer.from(data).toString('base64');
  }

  this.encrypt = function encrypt(password) {
    try {
      const encodedPassword = Buffer.from(password).toString('base64');
      return encodedPassword;
    } catch (error) {
      console.error(error);
      return password;
    }
  };

  this.decrypt = function decrypt(encodedPassword) {
    try {
      const decodedPassword = Buffer.from(encodedPassword, 'base64').toString('utf8');
      return decodedPassword;
    } catch (error) {
      console.error(error);
      return encodedPassword;
    }
  };

  this.removeEmptyValues = function removeEmptyValues(obj) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (obj[key] === undefined || obj[key] === null) {
          delete obj[key];
        }
      }
    }
    return obj;
  }

  this.returnMessage = function returnMessage(msg, code) {
    return {
      message: msg,
      code: code
    }
  }

  this.getGeocode = async function getGeocode(address) {
    try {
      const locationIQUrl = `${process.env.LOCATION_IQ_MAP_URL}?key=${process.env.LOCATION_IQ_MAP_KEY}&q=${encodeURIComponent(address)}&format=json`;
      const response = await axios.get(locationIQUrl);
      if (response.status === 200) {
        const { lat, lon } = response.data[0];
        return { latitude: lat, longitude: lon };
      } else {
        return 'Failed to fetch coordinates.';
      }
    } catch (error) {
      console.error(error);
      return error;
    }

  }
  this.getToken = async function getToken(key, object) {
    const token = jwt.sign(object, key);
    return token;
  }

  this.retreiveToken = async function retreiveToken(key, token) {
    const decoded = jwt.verify(token, key);
    return (decoded);
  }
  this.getLookUpId = async function getLookUpId(fastify, group, code) {

    const getStatusIdQuery = await fastify.appdb('lookup_details as ld')
      .innerJoin('lookup_group as lg', 'lg.lookup_group_id', 'ld.lookup_group_id')
      .where({ 'lg.lookup_group_cd': group, 'ld.dtl_cd': code })
      .select(['ld.lookup_dtl_id']).first();

    let lookupStatus;
    try {
      lookupStatus = await getStatusIdQuery;
      return lookupStatus?.lookup_dtl_id
    } catch (error) {
      console.error('Error retrieving lookup status:', error);
      throw new Error('Error retrieving lookup status');
    }
  }

  this.returnMultiRow = async function returnMultiRow(
    data,
  ) {
    // Req the parameters
    const currentPage = 1;
    const maxPage = 1;

    // Return the data
    return {
      rows: data,
      total_row_count: data.length,
      current_page_number: currentPage,
      max_page_number: maxPage,
    };
  };

  this.selectMultiRow = async function selectMultiRow(
    request,
    response,
    knexQuery,
  ) {
    // Req the parameters
    const currentPage = request.params.start_page ?? 1;
    const perPage = request.params.items_per_page ?? 10000;
    let totalRowCount = request.params.total_row_count;
    const isFromStart = currentPage === 1;
    const isLengthAware = !totalRowCount;
    let maxPage = null; // calculated below

    // Apply pagination
    // Awaiting the query with execute and fetch the result
    const { data, pagination } = await knexQuery.paginate({
      perPage, currentPage, isFromStart, isLengthAware,
    });

    // Read pagination results
    if (!totalRowCount && isLengthAware) {
      totalRowCount = pagination.total;
      maxPage = pagination.lastPage;
    } else if (totalRowCount) {
      maxPage = Math.floor((1.0 * totalRowCount) / perPage);
    }

    // Return the data
    return {
      rows: data,
      total_row_count: totalRowCount,
      current_page_number: currentPage,
      max_page_number: maxPage,
    };
  };

  this.getAllUniqueDays = function getAllUniqueDays(arr) {
    const uniqueDays = new Set();
    if (!Array.isArray(arr)) return null;
    arr.forEach(appointment => {
      const startDate = new Date(appointment.appointmentStartDate);
      const endDate = new Date(appointment.appointmentEndDate);

      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        uniqueDays.add(date.getDate());
      }
    });

    return Array.from(uniqueDays);
  }

  this.selectSingleRow = async function selectSingleRow(
    request, response, knexQuery, allowEmpty = false) {
    // Awaiting the promise will execute the query
    const data = await knexQuery;

    // Return 404 if result not found
    if (!allowEmpty && data.length === 0) {
      response.notFound();
      return {};
    }

    // return first row
    return data[0];
  };
  this.createTimeRangesArray = function createTimeRangesArray(fromTime, toTime, breakStartTime, breakEndTime) {
    // Parse fromTime, toTime, breakStartTime, and breakEndTime strings to extract hours and minutes
    if (!fromTime || !toTime || !breakStartTime || !breakEndTime) {
      return [];
    }
    const [fromHours, fromMinutes] = fromTime.split(':').map(Number);
    const [toHours, toMinutes] = toTime.split(':').map(Number);
    const [breakStartHours, breakStartMinutes] = breakStartTime.split(':').map(Number);
    const [breakEndHours, breakEndMinutes] = breakEndTime.split(':').map(Number);

    // Initialize the result array to store time ranges
    const timeRanges = [];

    // Initialize the current time to the fromTime
    let currentHours = fromHours;
    let currentMinutes = fromMinutes;

    // Iterate through the time range in 1-hour increments
    while (currentHours < toHours || (currentHours === toHours && currentMinutes < toMinutes)) {
      // Check if the current time falls within the break period
      if (
        (currentHours > breakStartHours && currentHours < breakEndHours) ||
        (currentHours === breakStartHours && currentMinutes >= breakStartMinutes && currentMinutes < 60) ||
        (currentHours === breakEndHours && currentMinutes < breakEndMinutes)
      ) {
        // Increment the current time by 1 hour to skip the break period
        currentMinutes += 60;
        if (currentMinutes >= 60) {
          currentHours += 1;
          currentMinutes %= 60;
        }
        continue;
      }

      // Calculate next hour's time
      let nextHours = currentHours;
      let nextMinutes = currentMinutes + 60;
      if (nextMinutes >= 60) {
        nextHours += 1;
        nextMinutes %= 60;
      }

      const formattedCurrentTime = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      const formattedNextTime = `${nextHours.toString().padStart(2, '0')}:${nextMinutes.toString().padStart(2, '0')}`;

      timeRanges.push({ fromTime: formattedCurrentTime, toTime: formattedNextTime });
      currentHours = nextHours;
      currentMinutes = nextMinutes;
    }

    return timeRanges;
  }
  this.getLookupItemByKey = async function getLookupItemByKey(key) {
    const response = await fetch(process.env.RUNNING_PORT + `lookup/search?key=${key}`);
    return await response.json();
  }
  this.checkObjectIsEqual = function checkObjectIsEqual(obj, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

}
module.exports = fp(async (fastify, opts) => {
  fastify.decorate('lib', new Lib());
});
