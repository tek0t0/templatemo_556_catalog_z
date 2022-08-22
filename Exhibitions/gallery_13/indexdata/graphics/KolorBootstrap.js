//krpano instance
var krpano = null;
//trace
var debug = false;
//is krpano loaded
var krpanoLoaded = false;
//methods to call when plugin is loaded
var pluginLoaded = new ktools.Map();
//is tour started
var isTourStarted = false;
//fullscreen object
var kolorFullscreen = null;
//browser detection
var kolorBrowserDetect = null;
//start z-index value
var kolorStartIndex = 4000;
//target url for cross domains application
var crossDomainTargetUrl = '';
var tourLanguage;

if ( debug ) {
	if ( typeof(console) == 'undefined' ) {
		console = {log : function (text) {} };
	}
}

/* ======== FULLSCREEN STUFF ========================================== */

/**
 * @description Register Fullscreen on DOM ready.
 */
jQuery(document).ready(function() {
	//add browser detection
	kolorBrowserDetect = new ktools.BrowserDetect();
	kolorBrowserDetect.init();
	//kolorBrowserDetect.browser : Browser string
	//kolorBrowserDetect.version : Browser version
	//kolorBrowserDetect.OS : Platform OS
	
	//add fullscreen
	kolorFullscreen = new ktools.Fullscreen(document.getElementById("tourDIV"));
	kolorFullscreen.supportsFullscreen();
	//activate krpano fallback and update methods
	kolorFullscreen.setExternal({
		'enter': krPanoFullscreenEnter,
		'exit': krPanoFullscreenExit,
		'change': krpanoFullscreenChange,
		'resize': krPanoFullscreenResize
	});
});

/**
 * @function
 * @description Enter fullscreen fallback method for krpano.
 * @return {void}
 */
function krPanoFullscreenEnter() {
	var ki = getKrPanoInstance();
	if(ki !== null){
		getKrPanoInstance().call("enterFullScreenFallback");
	}
}

/**
 * @function
 * @description Exit fullscreen fallback method for krpano.
 * @return {void}
 */
function krPanoFullscreenExit() {
	var ki = getKrPanoInstance();
	if(ki !== null){
		ki.call("exitFullScreenFallback");
	}
}

/**
 * @function
 * @description Launch method for krpano on fullscreen change event.
 * @param {Boolean} state If true enter fullscreen event, else exit fullscreen event.
 * @return {void}
 */
function krpanoFullscreenChange(state) {
	var ki = getKrPanoInstance();
	if(ki !== null){
		if(state){
			getKrPanoInstance().call("enterFullScreenChangeEvent");
		}else{
			getKrPanoInstance().call("exitFullScreenChangeEvent");
		}
	}
}

/**
 * @function
 * @description Launch resize method for krpano correct resize.
 * @return {void}
 */
function krPanoFullscreenResize() {
	var ki = getKrPanoInstance();
	if(ki !== null){
		getKrPanoInstance().call("resizeFullScreenEvent");
	}
}

/**
 * @function
 * @description Set fullscreen mode.
 * @param {String|Boolean} value The fullscreen status: 'true' for open or 'false' for close.
 * @return {void}
 */
function setFullscreen(value) {
	var state;
	if(typeof value == "string")
		state = (value.toLowerCase() == "true");
	else
		state = Boolean(value);

	if (kolorFullscreen) {
		if(state){
			kolorFullscreen.request();
		}else{
			kolorFullscreen.exit();
		}
	}
}

/* ========== DIALOG BETWEEN KRPANO/JS STUFF ================================= */

/**
 * @function
 * @description Get krpano instance.
 * @return {Object} krpano instance.
 */
function getKrPanoInstance() {
	if ( krpano == null ) {
		krpano = document.getElementById('krpanoSWFObject');
	}
	return krpano;
}

/**
 * @function
 * @description Call krpano function.
 * @param {String} fnName The krpano action name.
 * @param {*} Following parameters are passed to the krPano function
 * @return {void}
 */
function invokeKrFunction(fnName) {
	var args = [].slice.call(arguments, 1);
	var callString = fnName+'(';
	for(var i=0, ii=args.length; i<ii; i++)
	{
		callString += args[i];
		if(i != ii-1) { callString += ', '; }
	}
	callString += ');';
	if(getKrPanoInstance() !== null)
	{
		getKrPanoInstance().call(callString);
	}
}

/**
 * @function
 * @description Get krpano identifier value.
 * @param {String} identifier The qualifier.
 * @param {String} type The converting type. Can be: 'int', 'float', 'string', 'boolean', 'object'.
 * @return {Object}
 */
function getKrValue(identifier, type) {
	if ( typeof identifier == "undefined" ){
		return identifier;
	}
	
	if(getKrPanoInstance() !== null)
	{
		if(getKrPanoInstance().get(identifier) == null) {
			return null;
		}

		switch ( type ) {
			case "int":
				return parseInt(getKrPanoInstance().get(identifier));
			case "float":
				return parseFloat(getKrPanoInstance().get(identifier));
			case "string":
				return String(getKrPanoInstance().get(identifier));
			case "bool":
				return Boolean(getKrPanoInstance().get(identifier) === 'true' || parseInt(getKrPanoInstance().get(identifier)) === 1 || getKrPanoInstance().get(identifier) === 'yes' || getKrPanoInstance().get(identifier) === 'on');
			default:
				return getKrPanoInstance().get(identifier);
		}
	}
	else
	{
		return null;
	}
}

/**
 * @function
 * @description Invoke a function of a plugin engine.
 * @param {String} pluginName The name/id of the plugin.
 * @param {String} functionName The name of the function to invoke.
 * @param {Object[]} arguments Additional arguments will be passed to the invoked function as an array.
 * @return {Object}
 */
function invokePluginFunction(pluginName, functionName) {
	if ( debug ) {
		console.log("invokePluginFunction("+pluginName+", "+functionName+")");
	}
	
	var plugin = ktools.KolorPluginList.getInstance().getPlugin(pluginName);
	if (plugin == null) {
		if ( debug ) { console.log("invokePluginFunction: plugin instance doesn't exist"); }
		if(pluginLoaded && pluginLoaded.item(pluginName)){
			pluginLoaded.update(pluginName, arguments);
		}else{
			pluginLoaded.add(pluginName, arguments);
		}
		return false;
	}
	var engine = plugin.getRegistered();
	if (engine == null) {
		if ( debug ) { console.log("invokePluginFunction: plugin isn't registered"); }
		if(pluginLoaded && pluginLoaded.item(pluginName)){
			pluginLoaded.update(pluginName, arguments);
		}else{
			pluginLoaded.add(pluginName, arguments);
		}
		return false;
	}
	var restArgs = [].slice.call(arguments, 2);
	return engine[functionName](restArgs);
}

/**
 * @function
 * @description This function is called when krpano is ready.
 * The ready state of krpano is told by its event onready (in fact it's not fully ready, included XML are not necessarily loaded) 
 * @return {void}
 */
function eventKrpanoLoaded (isWebVr) {
	if ( debug ) {
		console.log('krpano is loaded');
	}
	
	if (krpanoLoaded) { return false; }
	
	tourLanguage = getKrValue("tour_language","string")
	if(typeof tourLanguage == "undefined"){
		tourLanguage = 'bg';
	}
	ktools.I18N.getInstance().initLanguage(tourLanguage, crossDomainTargetUrl+'indexdata/index_messages_','.xml');
	krpanoLoaded = true;
	
	if(isWebVr){
	
	addKolorAnalytics('analytics');

	}else{
	
	addKolorAnalytics('analytics');

	}
}

/**
 * @function
 * @description This function is called when plugins must be unloaded.
 * @return {void}
 */
function eventUnloadPlugins () {
	resetValuesForPlugins();

	deleteKolorAnalytics('analytics');

}

/**
 * @function
 * @description Reset the default values for the player and plugins loaders.
 * @return {void}
 */
function resetValuesForPlugins () {
	krpano = null;
	krpanoLoaded = false;
	isTourStarted = false;
	pluginLoaded = new ktools.Map();
	kolorStartIndex = 4000;
}

/**
 * @function
 * @description This function is called when tour is started.
 * @return {void}
 */
function eventTourStarted () {
	if ( debug ) {
		console.log('tour is started');
	}
	
	isTourStarted = true;
}

/**
 * @function
 * @description This function is called when tour language is updated.
 * @return {void}
 */
function eventTourChangeLanguage (pLang) {
	if ( debug ) {
		console.log('change tour language : '+pLang);
	}
	
	ktools.I18N.getInstance().initLanguage(pLang, crossDomainTargetUrl+'indexdata/index_messages_','.xml');
}


/* ========= KOLOR PLUGINS SCRIPTS ============================== */


/**
 * @function
 * @description Add an instance of KolorAnalytics JS Engine, loads JS and CSS files then init and populate related plugin that's based on it.
 * @param {String} pPlugID The name of the plugin you want to give to the kolorAnalytics instance.
 * @return {void}
 */
function addKolorAnalytics(pPlugID)
{
	if(typeof ktools.KolorPluginList.getInstance().getPlugin(pPlugID) == "undefined")
	{
		var kolorAnalyticsJS = new ktools.Script("KolorAnalyticsJS", crossDomainTargetUrl+"indexdata/graphics/KolorAnalytics/KolorAnalytics.min.js", [], true);
		var kolorAnalyticsPlugin = new ktools.KolorPlugin(pPlugID);
		kolorAnalyticsPlugin.addScript(kolorAnalyticsJS);
		ktools.KolorPluginList.getInstance().addPlugin(kolorAnalyticsPlugin.getPluginName(), kolorAnalyticsPlugin, true);

		//generate it
		if(!ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered() || !ktools.KolorPluginList.getInstance().getPlugin(pPlugID).isInitialized() || typeof KolorAnalytics == "undefined"){
			createKolorAnalytics(pPlugID);
		}
	}
}

/**
 * @function
 * @description Init, populate and show the KolorAnalytics.
 * @param {String} pPlugID The name of the plugin you want to init and show.
 * @return {void}
 */
function createKolorAnalytics(pPlugID)
{
	if(debug) { console.log("createKolorAnalytics "+pPlugID); }

	//Check if the KolorAnalytics is loaded
	if(!ktools.KolorPluginList.getInstance().getPlugin(pPlugID).isInitialized()  || typeof KolorAnalytics == "undefined")
	{
		err = "KolorAnalytics JS or XML is not loaded !";
		if(debug){ console.log(err); }
		//If not loaded, retry in 100 ms
		setTimeout(function() { createKolorAnalytics(pPlugID); }, 100);
		return;
	}

	//Check if the KolorAnalytics is instantiate and registered with the ktools.Plugin Object
	//If not, instantiate the KolorAnalytics and register it.
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered() == null)
	{
		ktools.KolorPluginList.getInstance().getPlugin(pPlugID).register(new KolorAnalytics(pPlugID, "panoDIV"));
	}

	//Get the registered instance of KolorAnalytics
	var kolorAnalytics = ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered();

	//If KolorAnalytics is not ready, populate datas
	if(!kolorAnalytics.isReady())
	{
		var kolorAnalyticsOptions = [];

		//Build the Options data for the KolorAnalytics
		var optionLength = parseInt(getKrPanoInstance().get("ptplugin["+pPlugID+"].settings.option.count"));

		for(var i = 0; i < optionLength; i++)
		{
			kolorAnalyticsOptions[getKrValue("ptplugin["+pPlugID+"].settings.option["+i+"].name","string")] = getKrValue("ptplugin["+pPlugID+"].settings.option["+i+"].value", getKrValue("ptplugin["+pPlugID+"].settings.option["+i+"].type", "string"));
		}

		kolorAnalytics.setKolorAnalyticsOptions(kolorAnalyticsOptions);

		//KolorAnalytics is now ready
		kolorAnalytics.setReady(true);

		//call ready statement for krpano script
		invokeKrFunction("kolorAnalyticsJsReady_"+pPlugID);

		//Display the KolorAnalytics
		kolorAnalytics.generateKolorAnalytics();
	}
}

/**
 * @function
 * @description Update and populate KolorAnalytics.
 * @param {String} pPlugID The name of the plugin you want to update.
 * @param {String} pLang The language used by the plugin.
 * @return {void}
 */
function updateKolorAnalytics(pPlugID,pLang)
{
	if(debug) { console.log("updateKolorAnalytics "+pPlugID); }

	//Check if the KolorAnalytics is loaded
	// if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID).isInitialized() && typeof KolorAnalytics != "undefined" && ktools.KolorPluginList.getInstance().getPlugin(pPlugID).getRegistered() != null)
	// {
	// }
}

/**
 * @function
 * @description Delete KolorAnalytics.
 * @param {String} pPlugID The name of the plugin you want to delete.
 * @return {void}
 */
function deleteKolorAnalytics(pPlugID)
{
	if(ktools.KolorPluginList.getInstance().getPlugin(pPlugID)){
		ktools.KolorPluginList.getInstance().removePlugin(pPlugID);
	}
}
