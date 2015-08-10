import {lint, hasAttribute, hasElement} from '../../src/linter';
import {load} from 'cheerio';

describe('HTML linter', () => {
  let html, $, expectation, expectations;
  beforeEach(() => {
    expectations = [{
      type: 'A',
      name: 'ng-repeat',
      value: '^[\\w]* in schoolProducts$',
      message: 'To display the list of your products on home, use an element with {{ value }} on this file.'
    }, {
      type: 'E',
      name: 'spinner',
      attributes: {
        name: 'global'
      },
      message: 'To display a loader while you home loads, include {{ value }} on your file.'
    }];
  });

  describe('when html is valid', () => {
    beforeEach(() => {
      html = `
        <div ng-repeat="schoolProduct in schoolProducts"></div>
        <spinner name="global"></spinner>
      `;
    });

    it('should return an empty array', () => {
      let result = lint(html, expectations);
      expect(result).to.be.an('array');
      expect(result.length).to.equal(0);
    });
  });

  describe('when html is invalid', () => {
    beforeEach(() => {
      html = `
        <div ng-repeat="category in categories"></div>
        <div class="panel"></div>
      `;
    });

    it('should return an array with messages', () => {
      let result = lint(html, expectations);
      expect(result).to.be.an('array');
      expect(result.length).to.equal(2);
      expect(result[0]).to.have.a.property('length', 3);
      expect(result[1]).to.have.a.property('length', 3);
    });
  });

  describe('on attribute linting', () => {
    beforeEach(() => {
      expectation = expectations[0];
    });

    it('should match if an ng-click exists', () => {
      expectation = {
        type: 'A',
        name: 'ng-click',
        value: 'removeFromCart(item)'
      };
      html = `
        <div class="pull-right">
          <a class="pointer" ng-click="removeFromCart(item)">
            <i class="fa fa-trash-o"></i>
          </a>
        </div>
      `;
      $ = load(html);
      expect(hasAttribute($, expectation)).to.be.true;
    });

    it('should match the if attribute exists', () => {
      html = '<div ng-repeat="schoolProduct in schoolProducts"></div>';
      $ = load(html);
      expect(hasAttribute($, expectation)).to.be.true;
    });

    it('should not match the if attribute doesn\'t exist', () => {
      html = '<div ng-repeat="category in categories"></div>';
      $ = load(html);
      expect(hasAttribute($, expectation)).to.be.false;
    });
  });

  describe('on element linting', () => {
    beforeEach(() => {
      expectation = expectations[1];
    });

    it('should match if a form with ng-submit exists', () => {
      expectation = {
        type: 'E',
        name: 'form',
        attributes: {
          'ng-submit': 'sendMessage(channel, message)',
          name: 'messageForm'
        }
      };

      html = `
        <form name="messageForm" ng-submit="sendMessage(channel, message)" class="form-horizontal">
          <select class="form-control" ng-model="channel.permission_key">
            <option value="content_management" selected="selected">Acadêmica</option>
            <option value="school_management">Administrativa</option>
            <option value="finance">Financeira</option>
          </select>
        </form>
      `;
      $ = load(html);
      expect(hasElement($, expectation)).to.be.true;
    });

    it('should match the if element exists', () => {
      html = '<spinner name="global"></spinner>';
      $ = load(html);
      expect(hasElement($, expectation)).to.be.true;
    });

    it('should not match the if element doesn\'t exist', () => {
      html = '<div class="panel"></div>';
      $ = load(html);
      expect(hasElement($, expectation)).to.be.false;
    });
  });
});
