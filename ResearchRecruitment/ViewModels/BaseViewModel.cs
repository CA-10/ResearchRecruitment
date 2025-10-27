namespace ResearchRecruitment.ViewModels;

public abstract class BaseViewModel
{
	public bool IsLoading { get; set; } = false;

	public abstract Task InitAsync();
}