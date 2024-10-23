import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface';
import { getBaseClasses } from '../../../src/utils';
import { SearchPatientTool } from './core';

export interface SearchPatientParams {
  authToken: string;
  patientId?: string;
  hospitalizationId?: string;
  searchTerm?: string;
}

class SearchPatient implements INode {
  label: string
  name: string
  version: number
  description: string
  type: string
  icon: string
  category: string
  author: string
  baseClasses: string[]
  inputs: INodeParams[]

  constructor() {
    this.label = 'Search Patient'
    this.name = 'searchPatient'
    this.version = 1.0
    this.type = 'SearchPatient'
    this.icon = 'searchPatient.svg'
    this.category = 'Tools'
    this.author = 'Your Name'
    this.description = 'SearchPatient'
    this.baseClasses = [this.type, ...getBaseClasses(SearchPatientTool)]
    this.inputs = [
      {
        label: 'Auth Token',
        name: 'authToken',
        type: 'string',
        additionalParams: true,
        default: '$vars.authToken',
        description: 'The auth token to use for the search',
        optional: true,
      },
      {
        label: 'Patient ID',
        name: 'patientId',
        type: 'string',
        additionalParams: true,
        description: 'The patient ID to search for',
        optional: true,
      },
      {
        label: 'Hospital ID',
        name: 'hospitalId',
        type: 'string',
        additionalParams: true,
        description: 'The hospital ID to search for',
        optional: true,
      },
      {
        label: 'Search Term',
        name: 'searchTerm',
        type: 'string',
        additionalParams: true,
        description: 'The search term to search for',
        optional: true,
      },
    ]
  }

  async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {

    const { chatId, sessionId, chatflowid, chatHistory = [] } = options

    console.log("🚀 ~ SearchPatient ~ init ~ options:", { chatId, sessionId, chatflowid, chatHistory })
    const authToken = nodeData.inputs?.authToken as string
    const patientId = nodeData.inputs?.patientId as string
    const hospitalId = nodeData.inputs?.hospitalId as string
    const searchTerm = nodeData.inputs?.searchTerm as string
    const obj: SearchPatientParams = { authToken }
    if (patientId) obj.patientId = patientId
    if (hospitalId) obj.hospitalizationId = hospitalId
    if (searchTerm) obj.searchTerm = searchTerm

    console.log("🚀 ~ SearchPatient ~ init ~ obj:", obj)
    return new SearchPatientTool(obj)
  }
}

module.exports = { nodeClass: SearchPatient }
