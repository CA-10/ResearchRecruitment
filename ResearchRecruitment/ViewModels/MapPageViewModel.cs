using ResearchRecruitment.Services;

namespace ResearchRecruitment.ViewModels;

public class MapPageViewModel : BaseViewModel
{
	private readonly IApiService _apiService;

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

		string responseJson = await _apiService.FetchEmbeddingDataAsync();
		return responseJson;
	}
}