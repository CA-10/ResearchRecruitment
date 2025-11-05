namespace ResearchRecruitment.Services;

public class ApiService : IApiService
{
	private readonly HttpClient _httpClient;

	public ApiService()
	{
		_httpClient = new();
	}

	public async Task<string> FetchEmbeddingDataAsync()
	{
		string json = string.Empty;

		try
		{
			var response = await _httpClient.GetAsync("http://localhost:7071/api/UserProfiles");
			response.EnsureSuccessStatusCode();
			json = await response.Content.ReadAsStringAsync();
		}
		catch (Exception ex)
		{
			json = string.Empty;
		}

		return json;
	}

	public async Task<string> FetchParticipantDataAsync(string participantId)
	{
		string json = string.Empty;

		try
		{
			if (string.IsNullOrEmpty(participantId))
				throw new Exception("Participant ID was not supplied");

			var response = await _httpClient.GetAsync($"http://localhost:7071/api/User/{participantId}");
			response.EnsureSuccessStatusCode();
			json = await response.Content.ReadAsStringAsync();
		}
		catch (Exception ex)
		{
			json = string.Empty;
		}

		return json;
	}
}