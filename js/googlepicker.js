/**!
 * Google Drive File Picker Example
 * By Daniel Lo Nigro (http://dan.cx/)
 */
(function() {
  /**
   * Initialise a Google Driver file picker
   */
  var FilePicker = window.FilePicker = function(options) {
    // Config
    this.apiKey = options.apiKey;
    this.clientId = options.clientId;

    // Elements
    this.buttonEl = options.buttonEl;

    // Events
    this.onSelect = options.onSelect;
    this.buttonEl.addEventListener('click', this.open.bind(this));

    // Disable the button until the API loads, as it won't work properly until then.
    this.buttonEl.disabled = true;

    // Load the drive API
    gapi.client.setApiKey(this.apiKey);
    gapi.client.load('drive', 'v2', this._driveApiLoaded.bind(this));
    google.load('picker', '1', { callback: this._pickerApiLoaded.bind(this) });
  }

  FilePicker.prototype = {
    /**
     * Open the file picker.
     */
    open: function() {
      // Check if the user has already authenticated
      var token = gapi.auth.getToken();
      if (token) {
        this._showPicker();
      } else {
        // The user has not yet authenticated with Google
        // We need to do the authentication before displaying the Drive picker.
        this._doAuth(false, function() { this._showPicker(); }.bind(this));
      }
    },

    /**
     * Show the file picker once authentication has been done.
     * @private
     */
    _showPicker: function() {
      var accessToken = gapi.auth.getToken().access_token;
      var view = new google.picker.DocsView();
      view.setIncludeFolders(true);
      this.picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setAppId(this.clientId)
        // .setDeveloperKey(this.apiKey)
        .setOAuthToken(accessToken)
        .addView(view)
        .setCallback(this._pickerCallback.bind(this))
        .build()
        .setVisible(true);
    },

    /**
     * Called when a file has been selected in the Google Drive file picker.
     * @private
     */
    _pickerCallback: function(data) {
      if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        var file = data[google.picker.Response.DOCUMENTS][0],
          id = file[google.picker.Document.ID],
          request = gapi.client.drive.files.get({
            fileId: id
          });

        request.execute(this._fileGetCallback.bind(this));
      }
    },
    /**
     * Called when file details have been retrieved from Google Drive.
     * @private
     */
    _fileGetCallback: function(file) {
      if (this.onSelect) {
        this.onSelect(file);
      }
    },

    /**
     * Called when the Google Drive file picker API has finished loading.
     * @private
     */
    _pickerApiLoaded: function() {
      this.buttonEl.disabled = false;
    },

    /**
     * Called when the Google Drive API has finished loading.
     * @private
     */
    _driveApiLoaded: function() {
      this._doAuth(true);
    },

    /**
     * Authenticate with Google Drive via the Google JavaScript API.
     * @private
     */
    _doAuth: function(immediate, callback) {
      gapi.auth.authorize({
        client_id: this.clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        immediate: immediate
      }, callback);
    }
  };
}());




// from https://gist.github.com/JLarky/640859bed8704520dd61
function initPicker() {
  var picker = new FilePicker({
    apiKey: 'AIzaSyCBKDUhBuEKVvZ4xjJknT4gBIn4bB0F_uc',
    clientId: '468292153625-kkfcqnjc6phj3j4u07n2fdislhdth327.apps.googleusercontent.com',
    buttonEl: document.getElementById('openGAPicker'),
    onSelect: function(file) {
      console.log(file);
      downloadFile(file,function(filedata){
        if(!filedata){
          alert('Error, could not load document...');
          return false;
        }
        processHTML(filedata);
      })
    }
  });
}

// from https://developers.google.com/drive/v2/reference/files/get
function downloadFile(file, callback) {
  if (file.exportLinks["text/html"]) {
    console.log('Downloading file contents...');
    $('#loading').show();
    $('#output-container').hide();  
    var accessToken = gapi.auth.getToken().access_token;
    console.log('accessToken',accessToken);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', file.exportLinks["text/html"]);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onload = function() {
      callback(xhr.responseText);
    };
    xhr.onerror = function() {
      callback(null);
    };
    xhr.send();
  } else {
    callback(null);
  }
}

$('document').ready(function(){
  $('#GAPickerLoading').hide();
  $('#openGAPicker').show();
});