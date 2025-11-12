using Moq;
using Moq.Protected;
using ResearchRecruitment.Services;
using System.Net;

namespace ResearchRecruitment.Tests;

public class ApiServiceTests
{
	private static HttpClient CreateMockHttpClient(HttpResponseMessage response)
	{
		var handlerMock = new Mock<HttpMessageHandler>();
		handlerMock.Protected()
			.Setup<Task<HttpResponseMessage>>(
				"SendAsync",
				ItExpr.IsAny<HttpRequestMessage>(),
				ItExpr.IsAny<CancellationToken>()
			)
			.ReturnsAsync(response);

		return new HttpClient(handlerMock.Object);
	}

	private class TestableApiService : ApiService
	{
		public TestableApiService(HttpClient httpClient)
		{
			//Override the HttpClient object in the service class to use the mock one which will be passed in.
			typeof(ApiService).GetField("_httpClient", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!.SetValue(this, httpClient);
		}
	}

	[Fact]
	public async Task FetchEmbeddingDataAsync_ReturnsJson_WhenSuccess()
	{
		//Arrange
		var expectedJson = "{\"data\":\"ok\"}";
		var httpClient = CreateMockHttpClient(new HttpResponseMessage(HttpStatusCode.OK)
		{
			Content = new StringContent(expectedJson)
		});
		var service = new TestableApiService(httpClient);

		//Act
		var result = await service.FetchEmbeddingDataAsync();

		//Assert
		Assert.Equal(expectedJson, result);
	}

	[Fact]
	public async Task FetchEmbeddingDataAsync_ReturnsEmpty_WhenRequestFails()
	{
		//Arrange
		var httpClient = CreateMockHttpClient(new HttpResponseMessage(HttpStatusCode.InternalServerError));
		var service = new TestableApiService(httpClient);

		//Act
		var result = await service.FetchEmbeddingDataAsync();

		//Assert
		Assert.Equal(string.Empty, result);
	}

	[Fact]
	public async Task FetchParticipantDataAsync_ReturnsJson_WhenSuccess()
	{
		//Arrange
		string participantId = "123";
		string expectedJson = "{\"id\":\"123\"}";
		var httpClient = CreateMockHttpClient(new HttpResponseMessage(HttpStatusCode.OK)
		{
			Content = new StringContent(expectedJson)
		});
		var service = new TestableApiService(httpClient);

		//Act
		var result = await service.FetchParticipantDataAsync(participantId);

		//Assert
		Assert.Equal(expectedJson, result);
	}

	[Fact]
	public async Task FetchParticipantDataAsync_ReturnsEmpty_WhenParticipantIdIsEmpty()
	{
		//Arrange
		var httpClient = CreateMockHttpClient(new HttpResponseMessage(HttpStatusCode.OK));
		var service = new TestableApiService(httpClient);

		//Act
		var result = await service.FetchParticipantDataAsync(string.Empty);

		//Assert
		Assert.Equal(string.Empty, result);
	}

	[Fact]
	public async Task FetchParticipantDataAsync_ReturnsEmpty_WhenRequestFails()
	{
		//Arrange
		var httpClient = CreateMockHttpClient(new HttpResponseMessage(HttpStatusCode.BadRequest));
		var service = new TestableApiService(httpClient);

		//Act
		var result = await service.FetchParticipantDataAsync("456");

		//Assert
		Assert.Equal(string.Empty, result);
	}
}