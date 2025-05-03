using Azure.Messaging.ServiceBus;
using Mango.Services.EmailAPI.Message;
using Mango.Services.EmailAPI.Models.Dto;
using Mango.Services.EmailAPI.Services;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Text;

namespace Mango.Services.EmailAPI.Messaging
{
    public class AzureServiceBusConsumer : IAzureServiceBusConsumer
    {
        private readonly string serviceBusConnectionString;
        private readonly string emailCartQueue;
        private readonly string emailRegisterQueue;
        private readonly IConfiguration _configuration;
        private readonly EmailService _emailService;

        private readonly string _orderCreated_Topic;
        private readonly string _orderCreated_Email_Subscription;
        private ServiceBusProcessor emailOrderPlacedProcessor;

        private ServiceBusProcessor _emailCartProcessor;
        private ServiceBusProcessor _emailRegisterProcessor;

        public AzureServiceBusConsumer(IConfiguration configuration, EmailService emailService)
        {
            _configuration = configuration;
            _emailService = emailService;

            serviceBusConnectionString = _configuration.GetValue<string>("ServiceBusConnectionString");

            emailCartQueue = _configuration.GetValue<string>("TopicAndQueueNanmes:EmailShoppingCartQueue");
            emailRegisterQueue = _configuration.GetValue<string>("TopicAndQueueNanmes:EmailRegisterQueue");

            _orderCreated_Topic = _configuration.GetValue<string>("TopicAndQueueNanmes:OrderCreatedTopic");
            _orderCreated_Email_Subscription = _configuration
                .GetValue<string>("TopicAndQueueNanmes:OrderCreated_Email_Subscription");

            var client = new ServiceBusClient(serviceBusConnectionString);
            //queue
            _emailCartProcessor = client.CreateProcessor(emailCartQueue);
            _emailRegisterProcessor = client.CreateProcessor(emailRegisterQueue);
            //topic
            emailOrderPlacedProcessor = client
                .CreateProcessor(_orderCreated_Topic, _orderCreated_Email_Subscription);
        }

        public async Task Start()
        {
            _emailCartProcessor.ProcessMessageAsync += OnEmailCartRequestReceived;
            _emailCartProcessor.ProcessErrorAsync += ErrorHandler;
            await _emailCartProcessor.StartProcessingAsync();

            _emailRegisterProcessor.ProcessMessageAsync += OnEmailRegisterRequestReceived;
            _emailRegisterProcessor.ProcessErrorAsync += ErrorHandler;
            await _emailRegisterProcessor.StartProcessingAsync();

            emailOrderPlacedProcessor.ProcessMessageAsync += OnOrderPlacedRequestReceived;
            emailOrderPlacedProcessor.ProcessErrorAsync += ErrorHandler;
            await emailOrderPlacedProcessor.StartProcessingAsync();


        }
        public async Task Stop()
        {
            await _emailCartProcessor.StopProcessingAsync();
            await _emailCartProcessor.DisposeAsync();

            await _emailRegisterProcessor.StopProcessingAsync();
            await _emailRegisterProcessor.DisposeAsync();

            await emailOrderPlacedProcessor.StopProcessingAsync();
            await emailOrderPlacedProcessor.DisposeAsync();


        }

        private async Task OnEmailCartRequestReceived(ProcessMessageEventArgs args)
        {
            //this is where will receive message
            var message = args.Message;
            var body = Encoding.UTF8.GetString(message.Body);

            CartDto objMessage = JsonConvert.DeserializeObject<CartDto>(body);
            try
            {
                //TODO - try to log email
                await _emailService.EmailCartAndLog(objMessage);
                await args.CompleteMessageAsync(args.Message);
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        
        private async Task OnOrderPlacedRequestReceived(ProcessMessageEventArgs args)
        {
            //this is where will receive message
            var message = args.Message;
            var body = Encoding.UTF8.GetString(message.Body);

            RewardsMessage objMessage = JsonConvert.DeserializeObject<RewardsMessage>(body);
            try
            {
                //TODO - try to log email
                await _emailService.LoadOrderPlaced(objMessage);
                await args.CompleteMessageAsync(args.Message);
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        
        private async Task OnEmailRegisterRequestReceived(ProcessMessageEventArgs args)
        {
            //this is where will receive message
            var message = args.Message;
            var body = Encoding.UTF8.GetString(message.Body);

            string email = JsonConvert.DeserializeObject<string>(body);
            try
            {
                //TODO - try to log email
                await _emailService.EmailRegisterAndLog(email);
                await args.CompleteMessageAsync(args.Message);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        private Task ErrorHandler(ProcessErrorEventArgs args)
        {
            Console.WriteLine(args.Exception.ToString());
            return Task.CompletedTask;
        }

    }
}
