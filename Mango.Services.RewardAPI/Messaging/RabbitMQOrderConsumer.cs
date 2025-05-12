using Mango.Services.RewardAPI.Message;
using Mango.Services.RewardAPI.Services;
using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Threading.Channels;

namespace Mango.Services.RewardAPI.Messaging
{
    public class RabbitMQOrderConsumer : BackgroundService
    {
        private readonly IConfiguration _configuration;
        private readonly RewardService _rewardService;
        private IConnection _connection;
        private IModel _channel;
        private const string OrderCreated_RewardsUpdateQueue = "RewardsUpdateQueue";
        private string ExchangeName = "";

        public RabbitMQOrderConsumer(IConfiguration configuration,
            RewardService rewardService)
        {
            _configuration = configuration;
            _rewardService = rewardService;
            ExchangeName = _configuration.GetValue<string>("TopicAndQueueNames:OrderCreatedTopic");

            var factory = new ConnectionFactory
            {
                HostName = "localhost",
                Password = "guest",
                UserName = "guest",
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();
            _channel.ExchangeDeclare(ExchangeName,
                ExchangeType.Direct);

            _channel.QueueDeclare(OrderCreated_RewardsUpdateQueue, false,false,false,null);
            _channel.QueueBind(OrderCreated_RewardsUpdateQueue, ExchangeName, "RewardsUpdate");

        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            stoppingToken.ThrowIfCancellationRequested();

            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += (channel, eventt) =>
            {
                var content = Encoding.UTF8
                                .GetString(eventt.Body.ToArray());
                RewardsMessage rewardMsg = JsonConvert.DeserializeObject<RewardsMessage>(content);
                HandleMessage(rewardMsg).GetAwaiter().GetResult();

                _channel.BasicAck(eventt.DeliveryTag, false);
            };

            _channel.BasicConsume(OrderCreated_RewardsUpdateQueue,
                false, consumer);

            return Task.CompletedTask;
        }

        private async Task HandleMessage(RewardsMessage rewardMsg)
        {
            _rewardService.UpdateRewards(rewardMsg).GetAwaiter().GetResult();
        }
    }
}
