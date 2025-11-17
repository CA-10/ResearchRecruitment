namespace ResearchRecruitment.Services;

public interface IApiService
{
	public Task<string> FetchEmbeddingDataAsync(string bitmask = "none");
	public Task<string> FetchParticipantDataAsync(string participantId);
}