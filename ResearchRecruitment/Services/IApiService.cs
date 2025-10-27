namespace ResearchRecruitment.Services;

public interface IApiService
{
	public Task<string> FetchEmbeddingDataAsync();
}