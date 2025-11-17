using Newtonsoft.Json;
using ResearchRecruitment.Models;
using ResearchRecruitment.Services;
using System.Text;

namespace ResearchRecruitment.ViewModels;

public class MapPageViewModel : BaseViewModel
{
	private readonly IApiService _apiService;

	public bool[] GroupByBools { get; set; } = [false, false, true, true, true, true];

	public MapPageViewModel(IApiService apiService)
	{
		_apiService = apiService;
	}

	public override async Task InitAsync()
	{

	}

	public async Task<string> LoadEmbeddingDataAsync()
	{
		await Task.Delay(250); //Add a small delay to make the visual loading smoother.

		StringBuilder sb = new();

		foreach (bool groupBool in GroupByBools)
		{
			if (groupBool)
				sb.Append("1");
			else
				sb.Append("0");
		}

		string sbString = sb.ToString();

		if (!sbString.Contains('1'))
			sbString = "111111";

		string responseJson = await _apiService.FetchEmbeddingDataAsync(sbString);
		return responseJson;
	}

	public async Task<ParticipantDetails?> LoadParticipantDataAsync(string participantId)
	{
		string responseJson = await _apiService.FetchParticipantDataAsync(participantId);

		if (string.IsNullOrEmpty(responseJson))
			return null;

		ParticipantDetails? details = JsonConvert.DeserializeObject<ParticipantDetails>(responseJson);

		return details;
	}
}