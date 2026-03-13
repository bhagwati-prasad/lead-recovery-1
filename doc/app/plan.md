# An AI powered lead recovery system which helps organizations recover lost leads and put them back into the sales funnel. The system is self improving and should get more efficient with time.

## Context
* There is a sales funnel in my organization consisting of various steps. Potential customers drop out of the funnel due to various reasons and objections at different stage. I want to create a system which brings them back into sales funnel. There could be customers whose objections could be handled with assistance, or whose doubts could be resolved with some assistance, these leads could easily be fed back into the funnel after some assistance.

* The funnel configuration (number of steps and what happens at every step or substep) depends upon the sales process. There could be multiple types of funnels.

* To start with, for one funnel, I have data of customers who left off at a particular stage and a potential set of reasons why they left it. The reasons/objections/contentions are only speculative at this stage, we are not exactly sure why customer left.


## Potential workflow
1. System fetches dropped lead data (it could be excel sheet, an API or a database) and ingests it according to it's worflow requirements.
2. Using the customer data, funnel stage data and potential objections it assigns a conversion probability score to the lead. The conversion probability could be a single parameter or a composite parameter consisting of other fine grained parameters.
3. The system initiates a call (we'd start with call for each lead. But, each objection or stage may require different channel of communication, this would be optimized later).
4. During the call the AI agent is prepared for potential objections of the funnel stage, during the conversation AI Agent tries to establish actual customer objections, store it in database (as actual objections) and address them in accordance with the company policies.
5. After handling the objections the AI Agent would assist the customer getting back into the funnel where the customer dropped off by presenting them a link.
6. After the call the AI agent would generate an assessment for potential of lead conversion, which would be a factor in deciding wether human intervention is needed for further assistance or not. If the customer gets back into funnel then no human intervention is needed, if the customer raises unhandleable objection (something impossible to do, for example if the product is not needed) then also no human intervention is needed. If the customer raises an objection which AI agent doesn't know how to handle then the human intervention may be needed. The system should log the next-step (if require) or the unhandleable objection.

## System requirements
1. The steps or phases of execution of the system should be extremely granular.
2. The atomic steps should be composable, so that a third party service can be directly used in place of a set of steps or a single step.
3. The system should be configurable. For example, users should be able to create a funnel (according to process), assign funnel and funnel stage features, assign potential objections for funnel.

## Initial tech stack : The steps should be merged according to offerings of service providers listed below
1. Sarvam AI
2. Eleven lab