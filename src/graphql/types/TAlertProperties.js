async function TAlertProperties(alertProperties, fields) {
  // Build return object
  const alertPropertiesInfo = {
    atId: await (async () => {
      if ("atId" in fields) {
        return alertProperties["@Id"];
      } else {
        return null;
      }
    })(),
    atType: await (async () => {
      if ("atType" in fields) {
        return alertProperties["@Type"];
      } else {
        return null;
      }
    })(),
    id: await (async () => {
      if ("id" in fields) {
        return alertProperties.id;
      } else {
        return null;
      }
    })(),
    areaDesc: await (async () => {
      if ("areaDesc" in fields) {
        return alertProperties.areaDesc;
      } else {
        return null;
      }
    })(),
    geocode: await (async () => {
      if ("geocode" in fields) {
        const TGeoCode = require("./TGeoCode");
        return await TGeoCode(alertProperties.geocode, fields.geocode);
      } else {
        return null;
      }
    })(),
    affectedZones: await (async () => {
      if ("affectedZones" in fields) {
        return alertProperties.affectedZones;
      } else {
        return null;
      }
    })(),
    references: await (async () => {
      if ("references" in fields) {
        const TReference = require("./TReference");
        let references = [];
        for (let currentReference of alertProperties.references) {
          references.push(
            await TReference(currentReference, fields.references)
          );
        }
        return references;
      } else {
        return null;
      }
    })(),
    sent: await (async () => {
      if ("sent" in fields) {
        const date = new Date(alertProperties.sent);
        return alertProperties.sent ? date.toISOString() : null;
      } else {
        return null;
      }
    })(),
    effective: await (async () => {
      if ("effective" in fields) {
        const date = new Date(alertProperties.effective);
        return alertProperties.effective ? date.toISOString() : null;
      } else {
        return null;
      }
    })(),
    onset: await (async () => {
      if ("onset" in fields) {
        const date = new Date(alertProperties.onset);
        return alertProperties.onset ? date.toISOString() : null;
      } else {
        return null;
      }
    })(),
    expires: await (async () => {
      if ("expires" in fields) {
        const date = new Date(alertProperties.expires);
        return alertProperties.expires ? date.toISOString() : null;
      } else {
        return null;
      }
    })(),
    ends: await (async () => {
      if ("ends" in fields) {
        const date = new Date(alertProperties.ends);
        return alertProperties.ends ? date.toISOString() : null;
      } else {
        return null;
      }
    })(),
    status: await (async () => {
      if ("status" in fields) {
        return alertProperties.status;
      } else {
        return null;
      }
    })(),
    messageType: await (async () => {
      if ("messageType" in fields) {
        return alertProperties.messageType;
      } else {
        return null;
      }
    })(),
    category: await (async () => {
      if ("category" in fields) {
        return alertProperties.category;
      } else {
        return null;
      }
    })(),
    severity: await (async () => {
      if ("severity" in fields) {
        return alertProperties.severity;
      } else {
        return null;
      }
    })(),
    certainty: await (async () => {
      if ("certainty" in fields) {
        return alertProperties.certainty;
      } else {
        return null;
      }
    })(),
    urgency: await (async () => {
      if ("urgency" in fields) {
        return alertProperties.urgency;
      } else {
        return null;
      }
    })(),
    event: await (async () => {
      if ("event" in fields) {
        return alertProperties.event;
      } else {
        return null;
      }
    })(),
    sender: await (async () => {
      if ("sender" in fields) {
        return alertProperties.sender;
      } else {
        return null;
      }
    })(),
    senderName: await (async () => {
      if ("senderName" in fields) {
        return alertProperties.senderName;
      } else {
        return null;
      }
    })(),
    headline: await (async () => {
      if ("headline" in fields) {
        return alertProperties.headline;
      } else {
        return null;
      }
    })(),
    description: await (async () => {
      if ("description" in fields) {
        return alertProperties.description;
      } else {
        return null;
      }
    })(),
    instruction: await (async () => {
      if ("instruction" in fields) {
        return alertProperties.instruction;
      } else {
        return null;
      }
    })(),
    response: await (async () => {
      if ("response" in fields) {
        return alertProperties.response;
      } else {
        return null;
      }
    })(),
    parameters: await (async () => {
      if ("parameters" in fields) {
        const TParameterObject = require("./TParameterObject");
        return await TParameterObject(
          alertProperties.parameters,
          fields.parameters
        );
      } else {
        return null;
      }
    })(),
    hazardInfo: await (async () => {
      if ("hazardInfo" in fields) {
        const THazardInfo = require("./THazardInfo");
        return await THazardInfo(alertProperties.event, fields.hazardInfo);
      } else {
        return null;
      }
    })(),
  };
  // Return requested data
  return alertPropertiesInfo;
}

module.exports = TAlertProperties;
