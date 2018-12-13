import ext from "./utils/ext";
import storage from "./utils/storage";
const $ = require("../../node_modules/jquery/dist/jquery.min");
const FilePond = require("../../node_modules/filepond/dist/filepond.min.js");
const crypto = require("crypto");
const path = require("path");
require("../../node_modules/materialize-css/dist/js/materialize.min");
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginFilePoster from "filepond-plugin-file-poster";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
var popup = document.getElementById("app");

var template = data => {
  var json = JSON.stringify(data);
  return `
  <div class="site-description">
    <h3 class="title">${data.title}</h3>
    <p class="description">${data.description}</p>
    <a href="${data.url}" target="_blank" class="url">${data.url}</a>
  </div>
  <div class="action-container">
    <button data-bookmark='${json}' id="save-btn" class="btn btn-primary">Save</button>
  </div>
  `;
};
var renderMessage = message => {
  var displayContainer = document.getElementById("display-container");
  displayContainer.innerHTML = `<p class='message'>${message}</p>`;
};

const initPageShow = function() {
  storage.get("ops", function(resp) {
    if (!resp.ops) {
      return M.toast({ html: "请先去选项页设置后台信息" });
    }

    for (let i of resp.ops) {
      if (!i.value || !i.value.trim()) {
        return M.toast({ html: "请先去选项页完善后台信息" });
      }
    }
    initApp({ ops: resp.ops });
  });
};

function initApp({ ops }) {
  console.log("FilePond", FilePond);
  $('.main-content').show();
  const conf = {};
  for (let i of ops) {
    conf[i.name] = i.value;
  }

  FilePond.registerPlugin(
    FilePondPluginImagePreview,
    // FilePondPluginFilePoster,
    FilePondPluginImageExifOrientation,
    FilePondPluginFileValidateSize
  );
  const pond = FilePond.create(document.querySelector("#file-input"));
  console.log("conf", conf);
  const hmac = crypto.createHmac("sha256", conf.secret);
  hmac.update(`${conf.user}-${conf.pw}`);
  const utoken = hmac.digest("hex");
  console.log("utoken", utoken);
  FilePond.setOptions({
    server: {
      process: {
        url: path.join(conf.server_addr, "/upload"),
        method: "POST",
        withCredentials: false,
        headers: {
          utoken: utoken
        },
        timeout: 120000,
        onload: function(response) {
          response = JSON.parse(response);
          return response.data.url;
        },
        onerror: function(response) {
          response = JSON.parse(response);
          return response.data.msg;
        }
      }
    }
  });

  document
    .querySelector("#file-input")
    .addEventListener("FilePond:processfile", e => {
      const serverId = e.detail.file.serverId;
      const $elem = $(`input[value="${serverId}"]`);
      const $parent = $elem.parents(".filepond--file-wrapper");
      const $info = $parent.find(".filepond--file-info");
      $info
        .find(".filepond--file-info-main")
        .replaceWith(
          $(
            `<a class="indigo lighten-5" href="${serverId}" target="_blank">${serverId}</a>`
          )
        );
      console.log("upload done", e);
    });
}

ext.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  if (window.location.href.indexOf("open") == -1) {
    var popupWindow = window.open(
      chrome.extension.getURL("popup.html?open=1"),
      "exampleName",
      "width=600,height=400"
    );
    return window.close(); // close the Chrome extension pop-up
  }

  var activeTab = tabs[0];
  chrome.tabs.sendMessage(
    activeTab.id,
    { action: "process-page" },
    initPageShow
  );
});

popup.addEventListener("click", function(e) {
  if (e.target && e.target.matches("#save-btn")) {
    e.preventDefault();
    var data = e.target.getAttribute("data-bookmark");
    ext.runtime.sendMessage({ action: "perform-save", data: data }, function(
      response
    ) {
      if (response && response.action === "saved") {
        renderMessage("Your bookmark was saved successfully!");
      } else {
        renderMessage("Sorry, there was an error while saving your bookmark.");
      }
    });
  }
});

var optionsLink = document.querySelector(".js-options");
optionsLink.addEventListener("click", function(e) {
  e.preventDefault();
  ext.tabs.create({ url: ext.extension.getURL("options.html") });
});
