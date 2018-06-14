public class Linebot {
    public void Post() { 
        JObject json = new JObject();
        string contentType = "application/json";
        json.Add("to", UserId.Text);
        JArray msg = new JArray();
        JObject m1 = new JObject();
        m1.Add("type", "text");
        m1.Add("text", Message.Text);
        msg.Add(m1);
        json.Add("messages", msg);
        string obj = JsonConvert.SerializeObject(json);
        Uri myuri = new Uri("https://api.line.me/v2/bot/message/push");
        var data = Encoding.UTF8.GetBytes(obj);
        SendRequest(myuri,data,contentType,"POST");
        Message.Text = "";
    }
    private string SendRequest(Uri uri ,byte[] jsonData,string contentType,string method) {
            WebRequest request = WebRequest.Create(uri);
            request.ContentType = "application/json";
            request.Method = "POST";
            request.ContentLength = jsonData.Length;
            request.Headers.Add("Authorization", "Bearer pxWdbnb80bWrURIiGVv5PSGmvCkLWB4aXHBlm0ZtwnHDLux0EKlZzjNFyUymiekQXUf8fY6voiyr0gWm3jk4KVvqPmcR9243LfcOcwamCmIgsNHAaHE13zOhtf9XjFMfaG4FZdlfnuF37wJRPa9HswdB04t89/1O/w1cDnyilFU=");
            
            
            var stream = request.GetRequestStream();
            stream.Write(jsonData, 0, jsonData.Length);
            stream.Close();

            WebResponse response = request.GetResponse();
            MessageBox.Show(((HttpWebResponse)response).StatusDescription);
            stream = response.GetResponseStream();
            StreamReader reader = new StreamReader(stream);
            string responseFromServer = reader.ReadToEnd();

            return responseFromServer;
        }

}