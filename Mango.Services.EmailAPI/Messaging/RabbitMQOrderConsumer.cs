﻿using Mango.Services.EmailAPI.Message;
using Mango.Services.EmailAPI.Models.Dto;
using Mango.Services.EmailAPI.Services;
using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Threading.Channels;

namespace Mango.Services.EmailAPI.Messaging
{
    public class RabbitMQOrderConsumer : BackgroundService
    {
        private readonly IConfiguration _configuration;
        private readonly EmailService _emailService;
        private IConnection _connection;
        private IModel _channel;
        private const string OrderCreated_EmailUpdateQueue = "EmailUpdateQueue";
        private string ExchangeName = "";
        string queueName = "";

        public RabbitMQOrderConsumer(IConfiguration configuration,
            EmailService emailService)
        {
            _configuration = configuration;
            _emailService = emailService;
            ExchangeName = _configuration.GetValue<string>("TopicAndQueueNanmes:OrderCreatedTopic");

            var factory = new ConnectionFactory
            {
                HostName = "localhost",
                Password = "guest",
                UserName = "guest",
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();
            _channel.ExchangeDeclare( ExchangeName,
                ExchangeType.Direct);

            _channel.QueueDeclare(OrderCreated_EmailUpdateQueue, false, false, false, null);
            _channel.QueueBind(OrderCreated_EmailUpdateQueue, ExchangeName, "EmailUpdate");

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

            _channel.BasicConsume(OrderCreated_EmailUpdateQueue,
                false, consumer);


            return Task.CompletedTask;
        }

        private async Task HandleMessage(RewardsMessage rewardMsg)
        {
            _emailService.LogOrderPlaced(rewardMsg).GetAwaiter().GetResult();
        }
    }
}
