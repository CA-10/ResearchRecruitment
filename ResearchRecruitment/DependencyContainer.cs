using ResearchRecruitment.Services;
using ResearchRecruitment.ViewModels;

namespace ResearchRecruitment;

public static class DependencyContainer
{
	public static void AddFunctionDependencies(this IServiceCollection services)
	{
		services.AddScoped<IApiService, ApiService>();
		services.AddScoped<MapPageViewModel>();
	}
}