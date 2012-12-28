/*
  This proxy page does not have any security checks. It is highly recommended
  that a user deploying this proxy page on their web server, add appropriate
  security checks, for example checking request path, username/password, target
  url, etc.
*/
using System;
using System.Configuration;
using System.IO;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Caching;
using System.Xml.Serialization;


/// <summary>
/// Forwards requests to an ArcGIS Server REST resource. Uses information in
/// the proxy.config file to determine properties of the server.
/// </summary>
/// <remarks>
/// This code came from <see href="http://help.arcgis.com/en/webapi/javascript/arcgis/help/jshelp_start.htm#jshelp/ags_proxy.htm"/>.
/// </remarks>
public class proxy : IHttpHandler {

	/// <summary>
	/// Appends an AccessCode parameter to the input URI if it is a WSDOT Traveler Info REST API URI and does not already have an AccessCode parameter.
	/// </summary>
	/// <param name="uri">The URI passed to the proxy. Note that this string will be modified if an access code is determined to be necessary.</param>
	private static void AddTravelerApiAccessCodeIfNecessary(ref string uri)
	{
		const string urlPattern = @"(?i)wsdot\.wa\.gov\/Traffic\/api\/(\w+)\/\1REST\.svc";
		const string accessCodePattern = @"AccessCode=([^\s&])+";

		if (Regex.IsMatch(uri, urlPattern)) // If this is a traveler API URL...
		{
			if (!Regex.IsMatch(uri, accessCodePattern, RegexOptions.None))  // If the URL does not already have an AccessCode parameter...
			{
				string code = ConfigurationManager.AppSettings["accessCode"];
				char separator = uri.Contains("?") ? '&' : '?';
				uri = string.Format("{0}{1}AccessCode={2}", uri, separator, code);
			}
		}
	}
  
	public void ProcessRequest (HttpContext context) {

		HttpResponse response = context.Response;

		// Get the URL requested by the client (take the entire querystring at once
		//  to handle the case of the URL itself containing querystring parameters)
		string uri = context.Request.Url.Query.Substring(1);

		AddTravelerApiAccessCodeIfNecessary(ref uri);

		#region Disabled - Code for Tokens
		// This was causing the proxy to hang and I couldn't figure out why.
		////// Get token, if applicable, and append to the request
		////string token = getTokenFromConfigFile(uri);
		////if (!String.IsNullOrEmpty(token))
		////{
		////    if (uri.Contains("?"))
		////        uri += "&token=" + token;
		////    else
		////        uri += "?token=" + token;
		////} 
		#endregion
			
		System.Net.HttpWebRequest req = (System.Net.HttpWebRequest)System.Net.HttpWebRequest.Create(uri);
		req.Method = context.Request.HttpMethod;
		req.ServicePoint.Expect100Continue = false;
		req.Referer = context.Request.Headers["referer"];
				
		// Set body of request for POST requests
		if (context.Request.InputStream.Length > 0)
		{
			byte[] bytes = new byte[context.Request.InputStream.Length];
			context.Request.InputStream.Read(bytes, 0, (int)context.Request.InputStream.Length);
			req.ContentLength = bytes.Length;
			
			string ctype = context.Request.ContentType;
			if (String.IsNullOrEmpty(ctype)) {
			  req.ContentType = "application/x-www-form-urlencoded";
			}
			else {
			  req.ContentType = ctype;
			}
			
			using (Stream outputStream = req.GetRequestStream())
			{
				outputStream.Write(bytes, 0, bytes.Length);
			}
		}
		else {
		  req.Method = "GET";
		}
	
		// Send the request to the server
		System.Net.WebResponse serverResponse = null;
		try
		{
			serverResponse = req.GetResponse();
		}
		catch (System.Net.WebException webExc)
		{
			response.StatusCode = 500;
			response.StatusDescription = webExc.Status.ToString();
			response.Write(webExc.Response);
			response.End();
			return;
		}
		
		// Set up the response to the client
		if (serverResponse != null) {
			response.ContentType = serverResponse.ContentType;
			using (Stream byteStream = serverResponse.GetResponseStream())
			{

				// Text response
				if (serverResponse.ContentType.Contains("text") || 
					serverResponse.ContentType.Contains("json") ||
					serverResponse.ContentType.Contains("xml"))
				{
					using (StreamReader sr = new StreamReader(byteStream))
					{
						string strResponse = sr.ReadToEnd();
						response.Write(strResponse);
					}
				}
				else
				{
					// Binary response (image, lyr file, other binary file)
					BinaryReader br = new BinaryReader(byteStream);
					byte[] outb = br.ReadBytes((int)serverResponse.ContentLength);
					br.Close();

					// Tell client not to cache the image since it's dynamic
					response.CacheControl = "no-cache";

					// Send the image to the client
					// (Note: if large images/files sent, could modify this to send in chunks)
					response.OutputStream.Write(outb, 0, outb.Length);
				}

				serverResponse.Close();
			}
		}
		response.End();
	}
 
	public bool IsReusable {
		get {
			return false;
		}
	}

	// Gets the token for a server URL from a configuration file
	// TODO: ?modify so can generate a new short-lived token from username/password in the config file
	private string getTokenFromConfigFile(string uri)
	{
		try
		{
			ProxyConfig config = ProxyConfig.GetCurrentConfig();
			if (config != null)
				return config.GetToken(uri);
			else
				throw new ApplicationException(
					"Proxy.config file does not exist at application root, or is not readable.");
		}
		catch (InvalidOperationException)
		{
			// Proxy is being used for an unsupported service (proxy.config has mustMatch="true")
			HttpResponse response = HttpContext.Current.Response;
			response.StatusCode = (int)System.Net.HttpStatusCode.Forbidden;
			response.End();
		}
		catch (Exception e)
		{
			if (e is ApplicationException)
				throw e;
			
			// just return an empty string at this point
			// -- may want to throw an exception, or add to a log file
		}
		
		return string.Empty;
	}
}

[XmlRoot("ProxyConfig")]
public class ProxyConfig
{
	#region Static Members

	private static object _lockobject = new object();

	public static ProxyConfig LoadProxyConfig(string fileName)
	{
		ProxyConfig config = null;

		lock (_lockobject)
		{
			if (System.IO.File.Exists(fileName))
			{
				XmlSerializer reader = new XmlSerializer(typeof(ProxyConfig));
				using (System.IO.StreamReader file = new System.IO.StreamReader(fileName))
				{
					config = (ProxyConfig)reader.Deserialize(file);
				}
			}
		}

		return config;
	}

	public static ProxyConfig GetCurrentConfig()
	{
		ProxyConfig config = HttpRuntime.Cache["proxyConfig"] as ProxyConfig;
		if (config == null)
		{
			string fileName = GetFilename(HttpContext.Current);
			config = LoadProxyConfig(fileName);

			if (config != null)
			{
				CacheDependency dep = new CacheDependency(fileName);
				HttpRuntime.Cache.Insert("proxyConfig", config, dep);
			}
		}

		return config;
	}

	public static string GetFilename(HttpContext context)
	{
		return context.Server.MapPath("~/proxy.config");
	}
	#endregion

	ServerUrl[] serverUrls;
	bool mustMatch;

	[XmlArray("serverUrls")]
	[XmlArrayItem("serverUrl")]
	public ServerUrl[] ServerUrls
	{
		get { return this.serverUrls; }
		set { this.serverUrls = value; }
	}

	[XmlAttribute("mustMatch")]
	public bool MustMatch
	{
		get { return mustMatch; }
		set { mustMatch = value; }
	}

	public string GetToken(string uri)
	{
		foreach (ServerUrl su in serverUrls)
		{
			if (su.MatchAll && uri.StartsWith(su.Url, StringComparison.InvariantCultureIgnoreCase))
			{
				return su.Token;
			}
			else
			{
				if (String.Compare(uri, su.Url, StringComparison.InvariantCultureIgnoreCase) == 0)
					return su.Token;
			}
		}

		if (mustMatch)
			throw new InvalidOperationException();

		return string.Empty;
	}
}

public class ServerUrl
{
	string url;
	bool matchAll;
	string token;

	[XmlAttribute("url")]
	public string Url
	{
		get { return url; }
		set { url = value; }
	}

	[XmlAttribute("matchAll")]
	public bool MatchAll
	{
		get { return matchAll; }
		set { matchAll = value; }
	}

	[XmlAttribute("token")]
	public string Token
	{
		get { return token; }
		set { token = value; }
	}
}
