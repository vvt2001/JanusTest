const AppUtils = {};

AppUtils.replaceAll = (string, search, replacement) => {
  return string.split(search).join(replacement);
};

AppUtils.generateUniqueId = () => {
  return Date.now() + Math.round(Math.random() * 1000000);
};

AppUtils.generateObjectId = (canvas, eldCustom) => {
  let objId = 0;

  objId = Date.now() + Math.round(Math.random() * 1000000);

  let refObjects;

  if (typeof canvas != "undefined") {
    refObjects = canvas.refObjects;
  } else if (eldCustom.canvas != "undefined") {
    refObjects = eldCustom.canvas.refObjects;
  }

  if (Object.keys(refObjects).indexOf(objId) > -1) {
    objId = Date.now() + Math.round(Math.random() * 1000000);
  }

  return objId;
};

AppUtils.randomString = (len = 10) => {
  var charSet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var randomString = "";
  for (var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
};

AppUtils.buildUrl = (url, k, v) => {
  let key = encodeURIComponent(k),
    value = encodeURIComponent(v);

  let baseUrl = url.split("?")[0],
    newParam = key + "=" + value,
    params = "?" + newParam;

  let urlQueryString;

  if (url.split("?")[1] === undefined) {
    urlQueryString = "";
  } else {
    urlQueryString = "?" + url.split("?")[1];
  }
  if (urlQueryString) {
    let updateRegex = new RegExp("([?&])" + key + "[^&]*");
    let removeRegex = new RegExp("([?&])" + key + "=[^&;]+[&;]?");

    if (value === undefined || value === null || value === "") {
      params = urlQueryString.replace(removeRegex, "$1");
      params = params.replace(/[&;]$/, "");
    } else if (urlQueryString.match(updateRegex) !== null) {
      params = urlQueryString.replace(updateRegex, "$1" + newParam);
    } else if (urlQueryString == "") {
      params = "?" + newParam;
    } else {
      params = urlQueryString + "&" + newParam;
    }
  }
  params = params === "?" ? "" : params;
  return baseUrl + params;
};

AppUtils.escapeXSS = (string) => {
  return string
    .replace(/\&/g, "&amp;")
    .replace(/\</g, "&lt;")
    .replace(/\>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/\'/g, "&#x27")
    .replace(/\//g, "&#x2F");
};

AppUtils.revertXSS = (string) => {
  return string
    .replace(/\&amp;/g, "&")
    .replace(/\&lt;/g, "<")
    .replace(/\&gt;/g, ">")
    .replace(/\&quot;/g, '"')
    .replace(/\&#x27/g, "'")
    .replace(/\&#x2F/g, "/");
};

AppUtils.hexToRGBA = (hex, opacity) => {
  return (
    "rgba(" +
    (hex = hex.replace("#", ""))
      .match(new RegExp("(.{" + hex.length / 3 + "})", "g"))
      .map(function (l) {
        return parseInt(hex.length % 2 ? l + l : l, 16);
      })
      .concat(opacity || 1)
      .join(",") +
    ")"
  );
};

AppUtils.setStorage = (key, value, expires) => {
  if (expires === undefined || expires === null) {
    expires = 24 * 60 * 60; // default: seconds for 1 day
  } else {
    expires = Math.abs(expires); //make sure it's positive
  }

  var now = Date.now(); //millisecs since epoch time, lets deal only with integer
  var schedule = now + expires * 1000;
  try {
    localStorage.setItem(key, value);
    localStorage.setItem(key + "_expiresIn", schedule);
  } catch (e) {
    return false;
  }
  return true;
};

// export default AppUtils
